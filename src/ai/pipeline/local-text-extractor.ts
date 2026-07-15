import * as FileSystem from 'expo-file-system';
import { Platform } from 'react-native';

let TesseractWorker: any = null;

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

export async function extractTextFromFile(fileUri: string, fileName: string): Promise<string> {
  const ext = fileName.toLowerCase().split('.').pop();
  try {
    if (ext === 'pdf') return await extractTextFromPdf(fileUri);
    if (['png', 'jpg', 'jpeg', 'webp', 'tiff', 'tif'].includes(ext || '')) return await extractTextFromImage(fileUri);
  } catch (e: any) {
    console.warn('Text extraction failed:', e?.message);
  }
  return '';
}

async function extractTextFromPdf(fileUri: string): Promise<string> {
  if (Platform.OS === 'web') {
    try {
      const pdfjsLib = await import('pdfjs-dist');
      pdfjsLib.GlobalWorkerOptions.workerSrc = '';
      const response = await fetch(fileUri);
      const data = await response.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data, useWorkerFetch: false, isEvalSupported: false, useSystemFonts: true }).promise;
      let text = '';
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        const strings = content.items.map((item: any) => item.str);
        text += strings.join(' ') + '\n\n';
      }
      return text.trim();
    } catch (e: any) {
      console.warn('PDF text extraction failed:', e?.message);
      return '';
    }
  }

  try {
    const base64 = await FileSystem.readAsStringAsync(fileUri, { encoding: FileSystem.EncodingType.Base64 });
    const { PDFParser } = await import('react-native-pdf-parser');
    const parser = new PDFParser();
    const result = await parser.parseBuffer(base64, 'base64');
    return result.pages?.map((p: any) => p.texts?.map((t: any) => t.text).join(' ')).join('\n\n') || '';
  } catch { return ''; }
}

async function extractTextFromImage(fileUri: string): Promise<string> {
  if (Platform.OS === 'web') {
    try {
      const Tesseract = await getTesseract();
      if (!Tesseract) return '';
      const result = await Tesseract.recognize(fileUri, 'eng+hin', {});
      return result.data?.text || '';
    } catch (e: any) {
      console.warn('Image OCR failed:', e?.message);
      return '';
    }
  }

  try {
    const base64 = await FileSystem.readAsStringAsync(fileUri, { encoding: FileSystem.EncodingType.Base64 });
    const Tesseract = await getTesseract();
    if (!Tesseract) return '';
    const result = await Tesseract.recognize(`data:image/jpeg;base64,${base64}`, 'eng+hin', {});
    return result.data?.text || '';
  } catch { return ''; }
}
