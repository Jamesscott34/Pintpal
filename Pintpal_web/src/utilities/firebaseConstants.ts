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
} as const;

export const UserFields = {
  email: "email",
  name: "name",
  role: "role",
  canLogin: "canLogin",
  canViewAdmin: "canViewAdmin",
} as const;
