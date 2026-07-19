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
  /** Community pint photo contest entries. */
  pintPhotos: "pint_photos",
  /** Weekly contest finalists + winner (doc id = weekKey). */
  contestWeeks: "contest_weeks",
  /** Daily winners cache (doc id = dayKey yyyy-MM-dd). */
  contestDays: "contest_days",
} as const;

export const PintPhotoFields = {
  userId: "userId",
  displayName: "displayName",
  imageUrl: "imageUrl",
  storagePath: "storagePath",
  createdAt: "createdAt",
  dayKey: "dayKey",
  weekKey: "weekKey",
  ratingSum: "ratingSum",
  ratingCount: "ratingCount",
  averageRating: "averageRating",
} as const;

export const PintPhotoRatingFields = {
  score: "score",
  createdAt: "createdAt",
} as const;

export const ContestWeekFields = {
  status: "status",
  finalistIds: "finalistIds",
  winnerId: "winnerId",
  updatedAt: "updatedAt",
} as const;

export const ContestVoteFields = {
  photoId: "photoId",
  createdAt: "createdAt",
} as const;

export const ContestDayFields = {
  winnerId: "winnerId",
  averageRating: "averageRating",
  displayName: "displayName",
  imageUrl: "imageUrl",
  updatedAt: "updatedAt",
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
