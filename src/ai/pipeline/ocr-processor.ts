import { ExtractionMode } from '../../core/enums/extraction-mode';
import { isSupportedFileType, getFileMimeType } from '../../core/utils/file-utils';
import { FileException } from '../../core/errors/app-exception';
import { readFileAsBase64 } from '../../core/utils/web-file-utils';

export interface ProcessedFile {
  fileName: string;
  fileUri: string;
  mimeType: string;
  content: string;
  base64Data: string;
  isImage: boolean;
}

export class OcrProcessor {
  static async processFile(fileUri: string, fileName: string): Promise<ProcessedFile> {
    console.log(`[OcrProcessor] Starting processFile for: ${fileName}`);
    console.log(`[OcrProcessor] File URI type: ${typeof fileUri}, starts with: ${fileUri.substring(0, 60)}`);

    if (!isSupportedFileType(fileName)) {
      console.error(`[OcrProcessor] Unsupported file type: ${fileName}`);
      throw new FileException(`Unsupported file type: ${fileName}`, 'unsupported-file-type');
    }

    const mimeType = getFileMimeType(fileName);
    const isImage = mimeType.startsWith('image/');
    console.log(`[OcrProcessor] MIME type: ${mimeType}, isImage: ${isImage}`);

    console.log(`[OcrProcessor] Reading file as base64...`);
    const base64Data = await readFileAsBase64(fileUri);
    console.log(`[OcrProcessor] Base64 data length: ${base64Data?.length || 0}`);

    if (!base64Data || base64Data.length < 100) {
      console.error(`[OcrProcessor] File data too short or empty. Length: ${base64Data?.length || 0}`);
      throw new FileException('File data too short or empty', 'read-error');
    }

    console.log(`[OcrProcessor] Successfully processed: ${fileName} (${base64Data.length} chars base64)`);
    return {
      fileName,
      fileUri,
      mimeType,
      content: `[${isImage ? 'Image' : 'PDF'}: ${fileName}]`,
      base64Data,
      isImage,
    };
  }

  static supportsMode(mode: ExtractionMode): boolean {
    return true;
  }
}
