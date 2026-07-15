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
    if (!isSupportedFileType(fileName)) {
      throw new FileException(`Unsupported file type: ${fileName}`, 'unsupported-file-type');
    }

    const mimeType = getFileMimeType(fileName);
    const isImage = mimeType.startsWith('image/');

    const base64Data = await readFileAsBase64(fileUri);

    if (!base64Data || base64Data.length < 100) {
      throw new FileException('File data too short or empty', 'read-error');
    }

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
