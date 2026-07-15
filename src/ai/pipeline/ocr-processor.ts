import { ExtractionMode } from '../../core/enums/extraction-mode';
import { isSupportedFileType, getFileMimeType } from '../../core/utils/file-utils';
import { FileException } from '../../core/errors/app-exception';
import * as FileSystem from 'expo-file-system';

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

    let base64Data: string;

    if (isImage) {
      base64Data = await this.readImageAsBase64(fileUri);
    } else if (mimeType === 'application/pdf') {
      base64Data = await this.readPdfAsBase64(fileUri);
    } else {
      throw new FileException(`Cannot process file type: ${mimeType}`, 'unsupported-file-type');
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

  private static async readImageAsBase64(fileUri: string): Promise<string> {
    try {
      const base64 = await FileSystem.readAsStringAsync(fileUri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      if (!base64 || base64.length < 100) {
        throw new Error('Base64 data too short, file may be corrupted');
      }
      return base64;
    } catch (error: any) {
      throw new FileException(`Failed to read image: ${error.message}`, 'read-error');
    }
  }

  private static async readPdfAsBase64(fileUri: string): Promise<string> {
    try {
      const fileInfo = await FileSystem.getInfoAsync(fileUri);
      if (!fileInfo.exists) {
        throw new FileException('File does not exist', 'file-not-found');
      }
      if (fileInfo.size > 20 * 1024 * 1024) {
        throw new FileException('PDF file too large (max 20MB)', 'file-too-large');
      }
      const base64 = await FileSystem.readAsStringAsync(fileUri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      if (!base64 || base64.length < 100) {
        throw new Error('Base64 data too short, file may be corrupted or encrypted');
      }
      return base64;
    } catch (error: any) {
      if (error instanceof FileException) throw error;
      throw new FileException(`Failed to read PDF: ${error.message}`, 'read-error');
    }
  }

  static supportsMode(mode: ExtractionMode): boolean {
    return true;
  }
}
