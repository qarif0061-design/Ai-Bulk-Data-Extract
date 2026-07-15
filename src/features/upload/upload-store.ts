import { create } from 'zustand';
import * as DocumentPicker from 'expo-document-picker';
import { UploadFile, createUploadFile } from './upload-file';
import { FileStatus } from '../../core/enums/file-status';
import { isSupportedFileType, isFileSizeValid, isWithinFileLimit } from '../../core/utils/file-utils';
import { FILE_LIMITS } from '../../core/constants/app-constants';

interface UploadState {
  files: UploadFile[];
  uploadProgress: Record<string, number>;
  addFiles: () => Promise<void>;
  addSingleFile: (file: UploadFile) => void;
  removeFile: (id: string) => void;
  updateFileStatus: (id: string, status: FileStatus, error?: string) => void;
  clearFiles: () => void;
  canAddMore: () => boolean;
  simulateUpload: (id: string) => void;
}

export const useUploadStore = create<UploadState>((set, get) => ({
  files: [],
  uploadProgress: {},

  simulateUpload: (id: string) => {
    set((state) => ({
      files: state.files.map((f) =>
        f.id === id ? { ...f, status: FileStatus.UPLOADING } : f
      ),
      uploadProgress: { ...state.uploadProgress, [id]: 0 },
    }));

    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.random() * 25 + 10;
      if (progress >= 100) {
        progress = 100;
        clearInterval(interval);
        set((state) => ({
          files: state.files.map((f) =>
            f.id === id ? { ...f, status: FileStatus.UPLOADED } : f
          ),
          uploadProgress: { ...state.uploadProgress, [id]: 100 },
        }));
      } else {
        set((state) => ({
          uploadProgress: { ...state.uploadProgress, [id]: Math.round(progress) },
        }));
      }
    }, 200);
  },

  addFiles: async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: [
          'application/pdf',
          'image/png',
          'image/jpeg',
          'image/jpg',
          'image/webp',
          'image/tiff',
        ],
        multiple: true,
        copyToCacheDirectory: true,
      });

      if (result.canceled) return;

      const newFiles: UploadFile[] = [];
      const existingCount = get().files.length;

      for (const asset of result.assets) {
        const remaining = FILE_LIMITS.maxFilesPerJob - existingCount - newFiles.length;
        if (remaining <= 0) break;

        if (!isSupportedFileType(asset.name)) continue;
        if (!isFileSizeValid(asset.size || 0)) continue;

        newFiles.push(
          createUploadFile(asset.name, asset.uri, asset.mimeType || 'application/octet-stream', asset.size || 0)
        );
      }

      if (newFiles.length > 0) {
        set((state) => ({
          files: [...state.files, ...newFiles].slice(0, FILE_LIMITS.maxFilesPerJob),
        }));

        for (const file of newFiles) {
          get().simulateUpload(file.id);
        }
      }
    } catch (error) {
      console.error('Failed to pick files:', error);
    }
  },

  addSingleFile: (file: UploadFile) => {
    set((state) => {
      if (!isWithinFileLimit(state.files.length, 1)) return state;
      return { files: [...state.files, file] };
    });
    get().simulateUpload(file.id);
  },

  removeFile: (id: string) => {
    set((state) => {
      const { [id]: _progress, ...rest } = state.uploadProgress;
      return {
        files: state.files.filter((f) => f.id !== id),
        uploadProgress: rest,
      };
    });
  },

  updateFileStatus: (id: string, status: FileStatus, error?: string) => {
    set((state) => ({
      files: state.files.map((f) =>
        f.id === id ? { ...f, status, error } : f
      ),
    }));
  },

  clearFiles: () => set({ files: [], uploadProgress: {} }),

  canAddMore: () => get().files.length < FILE_LIMITS.maxFilesPerJob,
}));
