import { ExtractionMode } from '../../core/enums/extraction-mode';
import { isSupportedFileType, getFileMimeType } from '../../core/utils/file-utils';
import { FileException } from '../../core/errors/app-exception';
import * as FileSystem from 'expo-file-system';

export interface ProcessedFile {
  fileName: string;
  fileUri: string;
  mimeType: string;
  content: string;
  isImage: boolean;
}

export class OcrProcessor {
  static async processFile(fileUri: string, fileName: string): Promise<ProcessedFile> {
    if (!isSupportedFileType(fileName)) {
      throw new FileException(`Unsupported file type: ${fileName}`, 'unsupported-file-type');
    }

    const mimeType = getFileMimeType(fileName);
    const isImage = mimeType.startsWith('image/');

    let content: string;

    if (isImage) {
      content = await this.processImage(fileUri, fileName);
    } else if (mimeType === 'application/pdf') {
      content = await this.processPdf(fileUri, fileName);
    } else {
      throw new FileException(`Cannot process file type: ${mimeType}`, 'unsupported-file-type');
    }

    return {
      fileName,
      fileUri,
      mimeType,
      content,
      isImage,
    };
  }

  private static async processImage(fileUri: string, fileName: string): Promise<string> {
    try {
      const base64 = await FileSystem.readAsStringAsync(fileUri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      return `[Image file: ${fileName}]\nBase64 encoded image data available for AI vision processing.\nImage size: ${Math.round(base64.length * 0.75 / 1024)}KB`;
    } catch (error: any) {
      throw new FileException(`Failed to read image: ${error.message}`, 'read-error');
    }
  }

  private static async processPdf(fileUri: string, fileName: string): Promise<string> {
    try {
      const fileInfo = await FileSystem.getInfoAsync(fileUri);
      if (!fileInfo.exists) {
        throw new FileException('File does not exist', 'file-not-found');
      }
      return `[PDF file: ${fileName}]\nFile size: ${Math.round(fileInfo.size / 1024)}KB\nPDF content will be processed by the AI model.`;
    } catch (error: any) {
      if (error instanceof FileException) throw error;
      throw new FileException(`Failed to read PDF: ${error.message}`, 'read-error');
    }
  }

  static supportsMode(mode: ExtractionMode): boolean {
    return true;
  }
}
