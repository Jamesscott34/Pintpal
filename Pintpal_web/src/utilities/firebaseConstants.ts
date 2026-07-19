/**
 * firebaseConstants.ts
 *
 * Purpose: Shared Firebase / Firestore collection and field name constants (web).
 * Connects to: Firebase project pintpal-71452. Used by features/<name>/data modules.
 * Notes: Mirrors Android FirebaseConstants so both clients use identical names.
 */

export const FIREBASE_PROJECT_ID = "pintpal-71452";

export const Collections = {
  users: "users",
  /** Pour the Perfect Pint scores only — never mixed with ratings/contribution boards. */
  pourGameScores: "pour_game_scores",
  /** Serving Rush scores only — never mixed with pour or ratings boards. */
  servingGameScores: "serving_game_scores",
} as const;

export const UserFields = {
  email: "email",
  name: "name",
  role: "role",
  canLogin: "canLogin",
  canViewAdmin: "canViewAdmin",
  /** true == paid (unlimited photos); false == free (2 photos/day). Admins always paid. */
  subscriptionPaid: "subscriptionPaid",
  /** Free-tier counter: uploads on photoUploadDate (yyyy-MM-dd). */
  photoUploadsToday: "photoUploadsToday",
  photoUploadDate: "photoUploadDate",
  pourGameBestPracticeAccuracy: "pourGameBestPracticeAccuracy",
  pourGameBestTimedAccuracySums: "pourGameBestTimedAccuracySums",
  pourGameScoreboardOptIn: "pourGameScoreboardOptIn",
  servingGameBestScore: "servingGameBestScore",
  servingGameScoreboardOptIn: "servingGameScoreboardOptIn",
} as const;

/** Free tier daily photo upload limit. Paid / admin = unlimited. */
export const FREE_PHOTO_DAILY_LIMIT = 2;

export const PourGameScoreFields = {
  userId: "userId",
  displayName: "displayName",
  mode: "mode",
  score: "score",
  durationSeconds: "durationSeconds",
  level: "level",
  completedPours: "completedPours",
  bestSingleAccuracy: "bestSingleAccuracy",
  updatedAt: "updatedAt",
  isPublic: "isPublic",
} as const;

export const ServingGameScoreFields = {
  userId: "userId",
  displayName: "displayName",
  score: "score",
  completedOrders: "completedOrders",
  misses: "misses",
  updatedAt: "updatedAt",
  isPublic: "isPublic",
} as const;
