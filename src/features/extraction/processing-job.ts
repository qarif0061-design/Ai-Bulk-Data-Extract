import { ExtractionMode } from '../../core/enums/extraction-mode';

export interface ProcessingJob {
  id: string;
  mode: ExtractionMode;
  fileNames: string[];
  startedAt: Date;
  status: 'processing' | 'completed' | 'failed';
  progress?: number;
  error?: string;
  result?: any;
  jobId?: string;
}
