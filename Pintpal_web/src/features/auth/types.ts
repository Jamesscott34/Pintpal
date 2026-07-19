/**
 * types.ts (auth) — updated with pour-game profile bests.
 *
 * Purpose: Shared auth / users document types for the web auth feature.
 * Connects to: Firestore "users" collection and features/auth data + hooks.
 * Notes: Pour fields are Perfect Pour Accuracy personal bests only.
 */

export type UserRole = "user" | "admin" | string;

export type UserDocument = {
  uid: string;
  email: string;
  name: string;
  role: UserRole;
  canLogin: boolean;
  canViewAdmin: boolean;
  pourGameBestPracticeAccuracy?: number | null;
  /** durationSeconds string → best timed accuracy sum */
  pourGameBestTimedAccuracySums?: Record<string, number>;
  pourGameScoreboardOptIn?: boolean;
};

export type AuthFormState = {
  isLoading: boolean;
  errorMessage: string | null;
};
