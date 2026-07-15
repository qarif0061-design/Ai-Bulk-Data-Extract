import * as FileSystem from 'expo-file-system';
import { Platform } from 'react-native';

let TesseractWorker: any = null;
let PdfjsLib: any = null;

async function getTesseract() {
  if (Platform.OS !== 'web') return null;
  try {
    if (!TesseractWorker) {
      const Tesseract = await import('tesseract.js');
      TesseractWorker = Tesseract;
    }
    return TesseractWorker;
  } catch { return null; }
}

async function getPdfjs() {
  if (Platform.OS !== 'web') return null;
  try {
    if (!PdfjsLib) {
      const pdfjs = await import('pdfjs-dist');
      PdfjsLib = pdfjs;
      PdfjsLib.GlobalWorkerOptions.workerSrc = '';
    }
    return PdfjsLib;
  } catch { return null; }
}

export async function extractTextFromFile(fileUri: string, fileName: string): Promise<string> {
  const ext = fileName.toLowerCase().split('.').pop();
  if (ext === 'pdf') return extractTextFromPdf(fileUri);
  if (['png', 'jpg', 'jpeg', 'webp', 'tiff', 'tif'].includes(ext || '')) return extractTextFromImage(fileUri, fileName);
  return '';
}

async function extractTextFromPdf(fileUri: string): Promise<string> {
  if (Platform.OS === 'web') {
    try {
      const pdfjs = await getPdfjs();
      if (!pdfjs) return '';
      const response = await fetch(fileUri);
      const data = await response.arrayBuffer();
      const pdf = await pdfjs.getDocument({ data }).promise;
      let text = '';
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        const strings = content.items.map((item: any) => item.str);
        text += strings.join(' ') + '\n\n';
      }
      return text.trim();
    } catch { return ''; }
  }

  try {
    const base64 = await FileSystem.readAsStringAsync(fileUri, { encoding: FileSystem.EncodingType.Base64 });
    const { PDFParser } = await import('react-native-pdf-parser');
    const parser = new PDFParser();
    const result = await parser.parseBuffer(base64, 'base64');
    return result.pages?.map((p: any) => p.texts?.map((t: any) => t.text).join(' ')).join('\n\n') || '';
  } catch { return ''; }
}

async function extractTextFromImage(fileUri: string, _fileName: string): Promise<string> {
  if (Platform.OS === 'web') {
    try {
      const Tesseract = await getTesseract();
      if (!Tesseract) return '';
      const result = await Tesseract.recognize(fileUri, 'eng+hin', {});
      return result.data?.text || '';
    } catch { return ''; }
  }

  try {
    const base64 = await FileSystem.readAsStringAsync(fileUri, { encoding: FileSystem.EncodingType.Base64 });
    const response = await fetch(`data:image/jpeg;base64,${base64}`);
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);

    const Tesseract = await getTesseract();
    if (!Tesseract) return '';
    const result = await Tesseract.recognize(url, 'eng+hin', {});
    URL.revokeObjectURL(url);
    return result.data?.text || '';
  } catch { return ''; }
}
