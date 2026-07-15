import { create } from 'zustand';
import { SubscriptionTier, SUBSCRIPTION_CONFIGS, SubscriptionConfig } from '../../core/enums/subscription-tier';
import { useAuthStore } from '../../shared/hooks/use-auth';
import { FirestoreService } from '../../shared/services/firestore-service';

interface SubscriptionState {
  currentTier: SubscriptionTier;
  config: SubscriptionConfig;
  creditsRemaining: number;
  creditsUsed: number;
  filesUsed: number;
  isLoading: boolean;
  loadSubscription: () => Promise<void>;
  getUsagePercent: () => number;
  getCreditsPercent: () => number;
}

export const useSubscriptionStore = create<SubscriptionState>((set, get) => ({
  currentTier: SubscriptionTier.FREE,
  config: SUBSCRIPTION_CONFIGS[SubscriptionTier.FREE],
  creditsRemaining: 25,
  creditsUsed: 0,
  filesUsed: 0,
  isLoading: false,

  loadSubscription: async () => {
    try {
      set({ isLoading: true });
      const user = useAuthStore.getState().user;
      if (!user) return;

      const userModel = await FirestoreService.getUser(user.uid);
      if (userModel) {
        const config = SUBSCRIPTION_CONFIGS[userModel.subscriptionTier];
        set({
          currentTier: userModel.subscriptionTier,
          config,
          creditsRemaining: userModel.creditsRemaining,
          creditsUsed: userModel.creditsUsed,
          filesUsed: userModel.totalFilesProcessed,
          isLoading: false,
        });
      }
    } catch (error) {
      set({ isLoading: false });
    }
  },

  getUsagePercent: () => {
    const { config, filesUsed } = get();
    return Math.min(100, (filesUsed / config.maxFiles) * 100);
  },

  getCreditsPercent: () => {
    const { config, creditsUsed } = get();
    return Math.min(100, (creditsUsed / config.monthlyCredits) * 100);
  },
}));
