export enum FileStatus {
  PENDING = 'pending',
  UPLOADING = 'uploading',
  UPLOADED = 'uploaded',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

export const FILE_STATUS_COLORS: Record<FileStatus, string> = {
  [FileStatus.PENDING]: '#9E9E9E',
  [FileStatus.UPLOADING]: '#FBBC04',
  [FileStatus.UPLOADED]: '#1A73E8',
  [FileStatus.PROCESSING]: '#FBBC04',
  [FileStatus.COMPLETED]: '#34A853',
  [FileStatus.FAILED]: '#EA4335',
};

export const FILE_STATUS_LABELS: Record<FileStatus, string> = {
  [FileStatus.PENDING]: 'Pending',
  [FileStatus.UPLOADING]: 'Uploading',
  [FileStatus.UPLOADED]: 'Uploaded',
  [FileStatus.PROCESSING]: 'Processing',
  [FileStatus.COMPLETED]: 'Completed',
  [FileStatus.FAILED]: 'Failed',
};
