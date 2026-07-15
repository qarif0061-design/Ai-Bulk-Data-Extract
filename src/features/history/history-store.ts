import { create } from 'zustand';
import { JobModel, jobFromFirestore } from '../../shared/models/job-model';
import { FirestoreService } from '../../shared/services/firestore-service';
import { useAuthStore } from '../../shared/hooks/use-auth';

interface HistoryState {
  jobs: JobModel[];
  isLoading: boolean;
  error: string | null;
  searchQuery: string;
  fetchJobs: () => Promise<void>;
  deleteJob: (jobId: string) => Promise<void>;
  setSearchQuery: (query: string) => void;
  getFilteredJobs: () => JobModel[];
}

export const useHistoryStore = create<HistoryState>((set, get) => ({
  jobs: [],
  isLoading: false,
  error: null,
  searchQuery: '',

  fetchJobs: async () => {
    try {
      set({ isLoading: true, error: null });
      const user = useAuthStore.getState().user;
      if (!user) return;

      const jobs = await FirestoreService.getUserJobs(user.uid);
      set({ jobs, isLoading: false });
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
    }
  },

  deleteJob: async (jobId: string) => {
    try {
      await FirestoreService.deleteJob(jobId);
      await FirestoreService.deleteExtractedData(jobId);
      set((state) => ({
        jobs: state.jobs.filter((j) => j.id !== jobId),
      }));
    } catch (error: any) {
      set({ error: error.message });
    }
  },

  setSearchQuery: (query: string) => set({ searchQuery: query }),

  getFilteredJobs: () => {
    const { jobs, searchQuery } = get();
    if (!searchQuery.trim()) return jobs;
    const lower = searchQuery.toLowerCase();
    return jobs.filter(
      (j) =>
        j.title.toLowerCase().includes(lower) ||
        j.extractionMode.toLowerCase().includes(lower)
    );
  },
}));
