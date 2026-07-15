import { ExtractionMode } from '../../core/enums/extraction-mode';

export enum JobStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
}

export interface JobModel {
  id: string;
  userId: string;
  title: string;
  status: JobStatus;
  extractionMode: ExtractionMode;
  files: { name: string; uri: string }[];
  fileCount: number;
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
  resultCount: number;
  totalCreditsUsed: number;
  errorMessage?: string;
  customPrompt?: string;
}

export function jobFromFirestore(data: any, id: string): JobModel {
  return {
    id,
    userId: data.userId,
    title: data.title || 'Untitled Job',
    status: data.status || JobStatus.PENDING,
    extractionMode: data.extractionMode,
    files: data.files || [],
    fileCount: data.fileCount || 0,
    createdAt: data.createdAt?.toDate?.() || new Date(data.createdAt),
    updatedAt: data.updatedAt?.toDate?.() || new Date(data.updatedAt),
    completedAt: data.completedAt?.toDate?.() || (data.completedAt ? new Date(data.completedAt) : undefined),
    resultCount: data.resultCount || 0,
    totalCreditsUsed: data.totalCreditsUsed || 0,
    errorMessage: data.errorMessage,
    customPrompt: data.customPrompt,
  };
}

export function jobToFirestore(job: JobModel): any {
  return {
    userId: job.userId,
    title: job.title,
    status: job.status,
    extractionMode: job.extractionMode,
    files: job.files,
    fileCount: job.fileCount,
    createdAt: job.createdAt,
    updatedAt: job.updatedAt,
    completedAt: job.completedAt || null,
    resultCount: job.resultCount,
    totalCreditsUsed: job.totalCreditsUsed,
    errorMessage: job.errorMessage || null,
    customPrompt: job.customPrompt || null,
  };
}
