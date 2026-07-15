import { SubscriptionTier } from '../../core/enums/subscription-tier';

export interface UserModel {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  isAnonymous: boolean;
  createdAt: Date;
  updatedAt: Date;
  subscriptionTier: SubscriptionTier;
  creditsRemaining: number;
  creditsUsed: number;
  totalFilesProcessed: number;
}

export function userModelFromFirestore(data: any, uid: string): UserModel {
  return {
    uid,
    email: data.email || null,
    displayName: data.displayName || null,
    photoURL: data.photoURL || null,
    isAnonymous: data.isAnonymous || false,
    createdAt: data.createdAt?.toDate?.() || new Date(data.createdAt),
    updatedAt: data.updatedAt?.toDate?.() || new Date(data.updatedAt),
    subscriptionTier: data.subscriptionTier || SubscriptionTier.FREE,
    creditsRemaining: data.creditsRemaining ?? 25,
    creditsUsed: data.creditsUsed ?? 0,
    totalFilesProcessed: data.totalFilesProcessed ?? 0,
  };
}

export function userModelToFirestore(user: UserModel): any {
  return {
    email: user.email,
    displayName: user.displayName,
    photoURL: user.photoURL,
    isAnonymous: user.isAnonymous,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
    subscriptionTier: user.subscriptionTier,
    creditsRemaining: user.creditsRemaining,
    creditsUsed: user.creditsUsed,
    totalFilesProcessed: user.totalFilesProcessed,
  };
}

export function createDefaultUser(uid: string, email?: string | null, displayName?: string | null, isAnonymous: boolean = false): UserModel {
  const now = new Date();
  return {
    uid,
    email: email || null,
    displayName: displayName || (isAnonymous ? 'Anonymous User' : 'User'),
    photoURL: null,
    isAnonymous,
    createdAt: now,
    updatedAt: now,
    subscriptionTier: SubscriptionTier.FREE,
    creditsRemaining: 25,
    creditsUsed: 0,
    totalFilesProcessed: 0,
  };
}
