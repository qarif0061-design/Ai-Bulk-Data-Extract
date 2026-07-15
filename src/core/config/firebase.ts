import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { initializeAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getStorage, FirebaseStorage } from 'firebase/storage';
import { FIREBASE_CONFIG } from './app-config';
import { Platform } from 'react-native';

let firebaseApp: FirebaseApp;
let firebaseAuth: Auth;

function getFirebaseConfig() {
  const platform = Platform.OS;
  return {
    apiKey: platform === 'ios' ? FIREBASE_CONFIG.apiKey.ios : platform === 'android' ? FIREBASE_CONFIG.apiKey.android : FIREBASE_CONFIG.apiKey.web,
    authDomain: FIREBASE_CONFIG.authDomain,
    projectId: FIREBASE_CONFIG.projectId,
    storageBucket: FIREBASE_CONFIG.storageBucket,
    messagingSenderId: FIREBASE_CONFIG.messagingSenderId,
    appId: platform === 'ios' ? FIREBASE_CONFIG.appId.ios : platform === 'android' ? FIREBASE_CONFIG.appId.android : FIREBASE_CONFIG.appId.web,
  };
}

export function initFirebase(): FirebaseApp {
  if (getApps().length > 0) {
    firebaseApp = getApp();
  } else {
    firebaseApp = initializeApp(getFirebaseConfig());
  }
  return firebaseApp;
}

export async function getFirebaseAuth(): Promise<Auth> {
  if (!firebaseAuth) {
    const app = initFirebase();
    if (Platform.OS === 'web') {
      const { getAuth } = await import('firebase/auth');
      firebaseAuth = getAuth(app);
    } else {
      const { getReactNativePersistence } = await import('firebase/auth');
      const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
      firebaseAuth = initializeAuth(app, {
        persistence: getReactNativePersistence(AsyncStorage),
      });
    }
  }
  return firebaseAuth;
}

export function getFirebaseFirestore(): Firestore {
  return getFirestore(initFirebase());
}

export function getFirebaseStorage(): FirebaseStorage {
  return getStorage(initFirebase());
}
