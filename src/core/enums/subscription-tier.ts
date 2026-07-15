export enum SubscriptionTier {
  FREE = 'free',
  STARTER = 'starter',
  PRO = 'pro',
  BUSINESS = 'business',
}

export interface SubscriptionConfig {
  tier: SubscriptionTier;
  label: string;
  maxFiles: number;
  monthlyCredits: number;
  price: number;
  features: string[];
}

export const SUBSCRIPTION_CONFIGS: Record<SubscriptionTier, SubscriptionConfig> = {
  [SubscriptionTier.FREE]: {
    tier: SubscriptionTier.FREE,
    label: 'Free',
    maxFiles: 10,
    monthlyCredits: 25,
    price: 0,
    features: ['10 files/month', '25 credits/month', 'All extraction modes', 'Email support'],
  },
  [SubscriptionTier.STARTER]: {
    tier: SubscriptionTier.STARTER,
    label: 'Starter',
    maxFiles: 50,
    monthlyCredits: 100,
    price: 9.99,
    features: ['50 files/month', '100 credits/month', 'All extraction modes', 'Priority support', 'Export to Excel'],
  },
  [SubscriptionTier.PRO]: {
    tier: SubscriptionTier.PRO,
    label: 'Pro',
    maxFiles: 500,
    monthlyCredits: 1000,
    price: 29.99,
    features: ['500 files/month', '1000 credits/month', 'All extraction modes', 'Priority support', 'Export to Excel', 'API access', 'Custom extraction modes'],
  },
  [SubscriptionTier.BUSINESS]: {
    tier: SubscriptionTier.BUSINESS,
    label: 'Business',
    maxFiles: 2000,
    monthlyCredits: 5000,
    price: 99.99,
    features: ['2000 files/month', '5000 credits/month', 'All extraction modes', 'Dedicated support', 'Export to Excel', 'API access', 'Custom extraction modes', 'Team collaboration', 'Custom integrations'],
  },
};

export function getSubscriptionConfig(tier: SubscriptionTier): SubscriptionConfig {
  return SUBSCRIPTION_CONFIGS[tier];
}
