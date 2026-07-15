import { SUPPORTED_FILE_TYPES, FILE_LIMITS } from '../constants/app-constants';

export function getFileExtension(fileName: string): string {
  const lastDot = fileName.lastIndexOf('.');
  if (lastDot === -1) return '';
  return fileName.substring(lastDot).toLowerCase();
}

export function getFileMimeType(fileName: string): string {
  const ext = getFileExtension(fileName);
  const mimeMap: Record<string, string> = {
    '.pdf': 'application/pdf',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.webp': 'image/webp',
    '.tiff': 'image/tiff',
    '.tif': 'image/tiff',
  };
  return mimeMap[ext] || 'application/octet-stream';
}

export function isSupportedFileType(fileName: string): boolean {
  const ext = getFileExtension(fileName);
  return SUPPORTED_FILE_TYPES.extensions.includes(ext);
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

export function isFileSizeValid(bytes: number): boolean {
  return bytes <= FILE_LIMITS.maxFileSizeMB * 1024 * 1024;
}

export function isWithinFileLimit(currentCount: number, addedCount: number): boolean {
  return currentCount + addedCount <= FILE_LIMITS.maxFilesPerJob;
}

export function getFileIcon(fileName: string): string {
  const ext = getFileExtension(fileName);
  switch (ext) {
    case '.pdf':
      return 'file-pdf-box';
    case '.png':
    case '.jpg':
    case '.jpeg':
    case '.webp':
    case '.tiff':
    case '.tif':
      return 'file-image-outline';
    default:
      return 'file-outline';
  }
}
