import { Platform } from 'react-native';

let tesseractModule: any = null;

async function getTesseract() {
  if (Platform.OS !== 'web') return null;
  try {
    if (!tesseractModule) {
      tesseractModule = await import('tesseract.js');
    }
    return tesseractModule;
  } catch (e: any) {
    console.warn('Tesseract import failed:', e?.message);
    return null;
  }
}

export async function extractTextFromFile(fileUri: string, fileName: string): Promise<string> {
  const ext = fileName.toLowerCase().split('.').pop();
  try {
    if (ext === 'pdf') return await extractTextFromPdf(fileUri);
    if (['png', 'jpg', 'jpeg', 'webp', 'tiff', 'tif'].includes(ext || '')) {
      return await extractTextFromImage(fileUri);
    }
  } catch (e: any) {
    console.warn('Text extraction failed for', fileName, ':', e?.message);
  }
  return '';
}

async function extractTextFromPdf(fileUri: string): Promise<string> {
  if (Platform.OS === 'web') {
    try {
      const pdfjsLib = await import('pdfjs-dist');

      // Set up worker properly for web
      pdfjsLib.GlobalWorkerOptions.workerSrc = '';

      const response = await fetch(fileUri);
      if (!response.ok) throw new Error(`Fetch PDF failed: ${response.status}`);
      const data = await response.arrayBuffer();

      const loadingTask = pdfjsLib.getDocument({
        data,
        useWorkerFetch: false,
        isEvalSupported: false,
        useSystemFonts: true,
        disableFontFace: true,
      });

      const pdf = await loadingTask.promise;
      let text = '';

      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        const strings = content.items.map((item: any) => item.str);
        text += strings.join(' ') + '\n\n';
      }

      return text.trim();
    } catch (e: any) {
      console.warn('PDF text extraction failed on web:', e?.message);
      return '';
    }
  }

  // Native path
  try {
    const FileSystem = await import('expo-file-system');
    const base64 = await FileSystem.default.readAsStringAsync(fileUri, {
      encoding: FileSystem.default.EncodingType.Base64,
    });
    const { PDFParser } = await import('react-native-pdf-parser');
    const parser = new PDFParser();
    const result = await parser.parseBuffer(base64, 'base64');
    return result.pages?.map((p: any) => p.texts?.map((t: any) => t.text).join(' ')).join('\n\n') || '';
  } catch (e: any) {
    console.warn('PDF text extraction failed on native:', e?.message);
    return '';
  }
}

async function extractTextFromImage(fileUri: string): Promise<string> {
  if (Platform.OS === 'web') {
    try {
      const Tesseract = await getTesseract();
      if (!Tesseract) {
        console.warn('Tesseract not available on web');
        return '';
      }

      // Fetch the image as a blob, then create an object URL for Tesseract
      const response = await fetch(fileUri);
      if (!response.ok) throw new Error(`Fetch image failed: ${response.status}`);
      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);

      try {
        const result = await Tesseract.recognize(objectUrl, 'eng', {});
        const text = result?.data?.text || '';
        return text;
      } finally {
        URL.revokeObjectURL(objectUrl);
      }
    } catch (e: any) {
      console.warn('Image OCR failed on web:', e?.message);
      return '';
    }
  }

  // Native path
  try {
    const FileSystem = await import('expo-file-system');
    const base64 = await FileSystem.default.readAsStringAsync(fileUri, {
      encoding: FileSystem.default.EncodingType.Base64,
    });
    const Tesseract = await getTesseract();
    if (!Tesseract) return '';
    const result = await Tesseract.recognize(`data:image/jpeg;base64,${base64}`, 'eng', {});
    return result?.data?.text || '';
  } catch (e: any) {
    console.warn('Image OCR failed on native:', e?.message);
    return '';
  }
}
