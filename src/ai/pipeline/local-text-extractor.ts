import { Platform } from 'react-native';
import { readAsStringAsync } from 'expo-file-system/legacy';

let tesseractModule: any = null;

async function getTesseract() {
  if (Platform.OS !== 'web') return null;
  try {
    if (!tesseractModule) {
      tesseractModule = await import('tesseract.js');
    }
    return tesseractModule;
  } catch (e: any) {
    console.warn('[Tesseract] Import failed:', e?.message);
    return null;
  }
}

export async function extractTextFromFile(fileUri: string, fileName: string): Promise<string> {
  const ext = fileName.toLowerCase().split('.').pop();
  console.log(`[extractTextFromFile] Processing: ${fileName} (ext: ${ext})`);
  try {
    if (ext === 'pdf') return await extractTextFromPdf(fileUri, fileName);
    if (['png', 'jpg', 'jpeg', 'webp', 'tiff', 'tif'].includes(ext || '')) {
      return await extractTextFromImage(fileUri, fileName);
    }
    console.log(`[extractTextFromFile] No extractor for ext: ${ext}`);
  } catch (e: any) {
    console.warn('[extractTextFromFile] Text extraction failed for', fileName, ':', e?.message);
  }
  return '';
}

async function extractTextFromPdf(fileUri: string, fileName: string): Promise<string> {
  console.log(`[extractTextFromPdf] Starting PDF extraction for: ${fileName}`);

  if (Platform.OS === 'web') {
    try {
      console.log(`[extractTextFromPdf] Importing pdfjs-dist...`);
      const pdfjsLib = await import('pdfjs-dist');
      pdfjsLib.GlobalWorkerOptions.workerSrc = '';
      console.log(`[extractTextFromPdf] pdfjs-dist imported successfully`);

      let response: Response;
      try {
        console.log(`[extractTextFromPdf] Fetching PDF from URI: ${fileUri.substring(0, 80)}`);
        response = await fetch(fileUri);
      } catch (fetchErr: any) {
        console.warn(`[extractTextFromPdf] Direct fetch failed: ${fetchErr.message}, trying with no-cors...`);
        response = await fetch(fileUri, { mode: 'cors', headers: { 'Accept': 'application/pdf,*/*' } });
      }

      console.log(`[extractTextFromPdf] Fetch response status: ${response.status}, ok: ${response.ok}`);
      if (!response.ok) throw new Error(`Fetch PDF failed: ${response.status}`);
      const data = await response.arrayBuffer();
      console.log(`[extractTextFromPdf] PDF data length: ${data.byteLength} bytes`);

      const pdf = await pdfjsLib.getDocument({
        data,
        useWorkerFetch: false,
        isEvalSupported: false,
        useSystemFonts: true,
        disableFontFace: true,
      }).promise;

      console.log(`[extractTextFromPdf] PDF loaded, pages: ${pdf.numPages}`);

      let text = '';
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        const strings = content.items.map((item: any) => item.str);
        text += strings.join(' ') + '\n\n';
        console.log(`[extractTextFromPdf] Page ${i}: ${strings.length} text items`);
      }
      console.log(`[extractTextFromPdf] Total extracted text: ${text.length} chars`);
      return text.trim();
    } catch (e: any) {
      console.warn('[extractTextFromPdf] PDF text extraction failed on web:', e?.message);
      return '';
    }
  }

  // Native path
  console.log(`[extractTextFromPdf] Native: using expo-file-system for PDF`);
  try {
    const base64 = await readAsStringAsync(fileUri, {
      encoding: 'base64',
    });
    console.log(`[extractTextFromPdf] Native base64 length: ${base64.length}`);
    const { PDFParser } = await import('react-native-pdf-parser');
    const parser = new PDFParser();
    const result = await parser.parseBuffer(base64, 'base64');
    const text = result.pages?.map((p: any) => p.texts?.map((t: any) => t.text).join(' ')).join('\n\n') || '';
    console.log(`[extractTextFromPdf] Native PDF text length: ${text.length}`);
    return text;
  } catch (e: any) {
    console.warn('[extractTextFromPdf] PDF text extraction failed on native:', e?.message);
    return '';
  }
}

async function extractTextFromImage(fileUri: string, fileName: string): Promise<string> {
  console.log(`[extractTextFromImage] Starting image OCR for: ${fileName}`);

  if (Platform.OS === 'web') {
    try {
      const Tesseract = await getTesseract();
      if (!Tesseract) {
        console.warn('[extractTextFromImage] Tesseract not available on web');
        return '';
      }

      let response: Response;
      try {
        console.log(`[extractTextFromImage] Fetching image from URI: ${fileUri.substring(0, 80)}`);
        response = await fetch(fileUri);
      } catch (fetchErr: any) {
        console.warn(`[extractTextFromImage] Direct fetch failed: ${fetchErr.message}, trying with no-cors...`);
        response = await fetch(fileUri, { mode: 'cors' });
      }

      console.log(`[extractTextFromImage] Fetch response status: ${response.status}`);
      if (!response.ok) throw new Error(`Fetch image failed: ${response.status}`);
      const blob = await response.blob();
      console.log(`[extractTextFromImage] Image blob size: ${blob.size}, type: ${blob.type}`);
      const objectUrl = URL.createObjectURL(blob);

      try {
        console.log(`[extractTextFromImage] Running Tesseract OCR...`);
        const result = await Tesseract.recognize(objectUrl, 'eng', {});
        const text = result?.data?.text || '';
        console.log(`[extractTextFromImage] OCR result: ${text.length} chars`);
        return text;
      } finally {
        URL.revokeObjectURL(objectUrl);
      }
    } catch (e: any) {
      console.warn('[extractTextFromImage] Image OCR failed on web:', e?.message);
      return '';
    }
  }

  // Native: no Tesseract available, return empty to trigger AI fallback
  console.log(`[extractTextFromImage] Native: no Tesseract, returning empty for AI fallback`);
  return '';
}
