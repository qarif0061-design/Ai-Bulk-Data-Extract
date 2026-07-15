import { AppException, AuthException, FirestoreException, ExtractionException } from './app-exception';

export function handleFirebaseError(error: any): string {
  if (error instanceof AppException) {
    return error.message;
  }

  const code = error?.code || '';

  if (code.startsWith('auth/')) {
    return handleAuthError(code);
  }

  if (code.startsWith('firestore/')) {
    return handleFirestoreError(code);
  }

  return error?.message || 'An unexpected error occurred.';
}

function handleAuthError(code: string): string {
  switch (code) {
    case 'auth/user-not-found':
      return 'No account found with this email.';
    case 'auth/wrong-password':
      return 'Incorrect password.';
    case 'auth/email-already-in-use':
      return 'An account already exists with this email.';
    case 'auth/invalid-email':
      return 'Invalid email address.';
    case 'auth/weak-password':
      return 'Password must be at least 6 characters.';
    case 'auth/too-many-requests':
      return 'Too many attempts. Please try again later.';
    case 'auth/network-request-failed':
      return 'Network error. Check your connection.';
    case 'auth/popup-closed-by-user':
      return 'Sign-in cancelled.';
    default:
      return 'Authentication error. Please try again.';
  }
}

function handleFirestoreError(code: string): string {
  switch (code) {
    case 'firestore/permission-denied':
      return 'Permission denied. Please check your access.';
    case 'firestore/not-found':
      return 'Document not found.';
    case 'firestore/unavailable':
      return 'Service temporarily unavailable.';
    default:
      return 'Database error. Please try again.';
  }
}

export function logError(error: any, context?: string): void {
  if (__DEV__) {
    console.error(`[Error${context ? ` - ${context}` : ''}]:`, error);
  }
}
