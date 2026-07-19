/**
 * types.ts (auth) — updated with subscription + pour-game profile bests.
 *
 * Purpose: Shared auth / users document types for the web auth feature.
 * Connects to: Firestore "users" collection and features/auth data + hooks.
 * Notes: subscriptionPaid true == paid, false == free. Admins always treated as paid.
 */

export type UserRole = "user" | "admin" | string;

export type UserDocument = {
  uid: string;
  email: string;
  name: string;
  role: UserRole;
  canLogin: boolean;
  canViewAdmin: boolean;
  /** Stored flag: true == paid, false == free. Prefer isSubscriptionPaid() for checks. */
  subscriptionPaid: boolean;
  photoUploadsToday: number;
  /** yyyy-MM-dd (UTC) of the last counted free-tier photo upload day. */
  photoUploadDate: string | null;
  pourGameBestPracticeAccuracy?: number | null;
  /** durationSeconds string → best timed accuracy sum */
  pourGameBestTimedAccuracySums?: Record<string, number>;
  pourGameScoreboardOptIn?: boolean;
  servingGameBestScore?: number | null;
  servingGameScoreboardOptIn?: boolean;
};

export type AuthFormState = {
  isLoading: boolean;
  errorMessage: string | null;
};
