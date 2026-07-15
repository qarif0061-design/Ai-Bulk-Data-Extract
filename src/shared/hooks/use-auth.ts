import { create } from 'zustand';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut as firebaseSignOut,
  User,
} from 'firebase/auth';
import { initFirebase, getFirebaseAuth } from '../../core/config/firebase';
import { FirestoreService } from '../services/firestore-service';
import { UserModel } from '../models/user-model';
import { SubscriptionTier } from '../../core/enums/subscription-tier';

interface AuthState {
  user: User | null;
  userModel: UserModel | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;
  initAuth: () => () => void;
  loginWithEmail: (email: string, password: string) => Promise<void>;
  signupWithEmail: (email: string, password: string, displayName: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  refreshUserModel: () => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  userModel: null,
  isLoading: true,
  isAuthenticated: false,
  error: null,

  initAuth: () => {
    initFirebase();
    let unsubAuth: (() => void) | null = null;

    getFirebaseAuth().then((auth) => {
      const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
        if (firebaseUser && !firebaseUser.isAnonymous) {
          let userModel: UserModel | null = null;
          try {
            userModel = await FirestoreService.ensureUserExists(
              firebaseUser.uid,
              firebaseUser.email,
              firebaseUser.displayName,
              false
            );
          } catch (e: any) {
            console.warn('Firestore unavailable, using local auth only:', e?.message);
            userModel = {
              uid: firebaseUser.uid,
              email: firebaseUser.email || undefined,
              displayName: firebaseUser.displayName || undefined,
              photoURL: firebaseUser.photoURL || undefined,
              isAnonymous: false,
              createdAt: new Date(),
              updatedAt: new Date(),
              subscriptionTier: 'free' as any,
              creditsRemaining: 10,
              creditsUsed: 0,
              totalFilesProcessed: 0,
            };
          }
          set({
            user: firebaseUser,
            userModel,
            isAuthenticated: true,
            isLoading: false,
          });
        } else {
          set({
            user: null,
            userModel: null,
            isAuthenticated: false,
            isLoading: false,
          });
        }
      });
      unsubAuth = unsubscribe;
    }).catch((e) => {
      console.warn('Firebase auth init failed:', e?.message);
      set({ isLoading: false });
    });

    return () => {
      if (unsubAuth) unsubAuth();
    };
  },

  loginWithEmail: async (email: string, password: string) => {
    try {
      set({ error: null, isLoading: true });
      const auth = await getFirebaseAuth();
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  signupWithEmail: async (email: string, password: string, displayName: string) => {
    try {
      set({ error: null, isLoading: true });
      const auth = await getFirebaseAuth();
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      if (cred.user) {
        try {
          await FirestoreService.createUser(cred.user.uid, email, displayName, false);
        } catch (e: any) {
          console.warn('Firestore unavailable for user creation:', e?.message);
        }
      }
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  loginWithGoogle: async () => {
    try {
      set({ error: null, isLoading: true });
      const auth = await getFirebaseAuth();
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  logout: async () => {
    try {
      const auth = await getFirebaseAuth();
      if (auth.currentUser) {
        await firebaseSignOut(auth);
      }
      set({
        user: null,
        userModel: null,
        isAuthenticated: false,
      });
    } catch (error: any) {
      set({
        user: null,
        userModel: null,
        isAuthenticated: false,
        error: error.message,
      });
    }
  },

  refreshUserModel: async () => {
    const { user } = get();
    if (user) {
      try {
        const userModel = await FirestoreService.getUser(user.uid);
        if (userModel) {
          set({ userModel });
        }
      } catch (e: any) {
        console.warn('Firestore unavailable for refresh:', e?.message);
      }
    }
  },

  clearError: () => set({ error: null }),
}));
