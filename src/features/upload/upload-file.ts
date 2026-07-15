import { FileStatus } from '../../core/enums/file-status';

export interface UploadFile {
  id: string;
  name: string;
  uri: string;
  mimeType: string;
  size: number;
  status: FileStatus;
  error?: string;
  base64?: string;
}

export function createUploadFile(name: string, uri: string, mimeType: string, size: number): UploadFile {
  return {
    id: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
    name,
    uri,
    mimeType,
    size,
    status: FileStatus.PENDING,
  };
}
