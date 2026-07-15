import { FileStatus } from '../../core/enums/file-status';

export interface FileModel {
  id: string;
  name: string;
  uri: string;
  mimeType: string;
  size: number;
  status: FileStatus;
  error?: string;
}

export function createFileModel(name: string, uri: string, mimeType: string, size: number): FileModel {
  return {
    id: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
    name,
    uri,
    mimeType,
    size,
    status: FileStatus.PENDING,
  };
}
