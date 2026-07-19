/**
 * index.ts (auth/data)
 *
 * Purpose: Public exports for auth data-layer functions.
 * Connects to: features/auth/hooks and components.
 */

export {
  registerWithEmail,
  signInWithEmail,
  signInWithGoogle,
  signOut,
  subscribeToAuth,
  loadUserDocument,
  loadAndEnforceLogin,
  LoginDeniedError,
} from "./authRepository";
