/**
 * authRepository.ts
 *
 * Purpose: Firebase Authentication wrapper for the auth feature (web).
 * Connects to: Firebase Auth web SDK. Used by useAuth hook (features/auth/hooks).
 *              Loads/writes Firestore "users/{uid}" where document ID = Auth UID.
 * Notes: Client-side only. Never sets role=admin, canViewAdmin=true, or
 *        subscriptionPaid=true on registration. Sign-in is rejected (and signed out)
 *        when canLogin is false. After sign-in, subscription is resolved via permissions
 *        (admin always paid; otherwise subscriptionPaid flag).
 */

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut as firebaseSignOut,
  GoogleAuthProvider,
  onAuthStateChanged,
  type User,
} from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { getFirebaseAuth, getFirebaseFirestore } from "@/utilities/firebase";
import { Collections, UserFields } from "@/utilities/firebaseConstants";
import { canLogin } from "@/utilities/permissions";
import type { UserDocument } from "@/features/auth/types";

export class LoginDeniedError extends Error {
  constructor(message = "This account cannot sign in (canLogin is false).") {
    super(message);
    this.name = "LoginDeniedError";
  }
}

function forNewRegistration(uid: string, email: string, name: string): UserDocument {
  return {
    uid,
    email,
    name,
    role: "user",
    canLogin: true,
    canViewAdmin: false,
    subscriptionPaid: false,
    photoUploadsToday: 0,
    photoUploadDate: null,
  };
}

function fromFirestore(uid: string, data: Record<string, unknown> | undefined): UserDocument {
  const timedRaw = data?.pourGameBestTimedAccuracySums;
  const timed: Record<string, number> = {};
  if (timedRaw && typeof timedRaw === "object") {
    for (const [k, v] of Object.entries(timedRaw as Record<string, unknown>)) {
      if (typeof v === "number") timed[k] = v;
    }
  }
  const practice = data?.pourGameBestPracticeAccuracy;
  const uploads = data?.photoUploadsToday;
  return {
    // Document ID is the Auth UID; always prefer the Auth uid argument over any field.
    uid,
    email: typeof data?.email === "string" ? data.email : "",
    name: typeof data?.name === "string" ? data.name : "",
    role: typeof data?.role === "string" ? data.role : "user",
    canLogin: data?.canLogin === true,
    canViewAdmin: data?.canViewAdmin === true,
    subscriptionPaid: data?.subscriptionPaid === true,
    photoUploadsToday: typeof uploads === "number" ? uploads : 0,
    photoUploadDate:
      typeof data?.photoUploadDate === "string" ? data.photoUploadDate : null,
    pourGameBestPracticeAccuracy:
      typeof practice === "number" ? practice : null,
    pourGameBestTimedAccuracySums: timed,
    pourGameScoreboardOptIn: data?.pourGameScoreboardOptIn === true,
    servingGameBestScore:
      typeof data?.servingGameBestScore === "number"
        ? data.servingGameBestScore
        : null,
    servingGameScoreboardOptIn: data?.servingGameScoreboardOptIn === true,
  };
}

/** Firestore path for a user profile: users/{authUid}. */
export function userDocumentRef(authUid: string) {
  return doc(getFirebaseFirestore(), Collections.users, authUid);
}

/**
 * Loads users/{uid} for the given Auth UID.
 * The document ID must match FirebaseAuth.currentUser.uid.
 */
export async function loadUserDocument(uid: string): Promise<UserDocument | null> {
  if (!uid) {
    throw new Error("Cannot load user profile without an authenticated Auth UID.");
  }
  const snapshot = await getDoc(userDocumentRef(uid));
  if (!snapshot.exists()) return null;
  return fromFirestore(uid, snapshot.data() as Record<string, unknown>);
}

async function writeNewUserDocument(document: UserDocument): Promise<void> {
  // New registrations only — never overwrite an existing admin/console-managed profile.
  await setDoc(userDocumentRef(document.uid), {
    [UserFields.email]: document.email,
    [UserFields.name]: document.name,
    [UserFields.role]: document.role,
    [UserFields.canLogin]: document.canLogin,
    [UserFields.canViewAdmin]: document.canViewAdmin,
    [UserFields.subscriptionPaid]: false,
    [UserFields.photoUploadsToday]: 0,
  });
}

/**
 * After Firebase Auth succeeds, load (or create) users/{user.uid} and enforce canLogin.
 * Callers should then resolve subscription with isSubscriptionPaid(document).
 */
export async function loadAndEnforceLogin(user: User): Promise<UserDocument> {
  const auth = getFirebaseAuth();
  const authUid = user.uid;
  if (!authUid) {
    await firebaseSignOut(auth);
    throw new Error("Authenticated user has no UID.");
  }

  let document = await loadUserDocument(authUid);
  if (!document) {
    document = forNewRegistration(
      authUid,
      user.email ?? "",
      user.displayName?.trim() || user.email || "",
    );
    await writeNewUserDocument(document);
  }

  // Guard: profile uid must always equal Auth uid.
  if (document.uid !== authUid) {
    await firebaseSignOut(auth);
    throw new Error("User profile UID does not match authenticated Auth UID.");
  }

  if (!canLogin(document)) {
    await firebaseSignOut(auth);
    throw new LoginDeniedError();
  }
  return document;
}

export async function registerWithEmail(
  email: string,
  password: string,
  name: string,
): Promise<UserDocument> {
  const auth = getFirebaseAuth();
  const trimmedEmail = email.trim();
  const trimmedPassword = password.trim();
  const result = await createUserWithEmailAndPassword(auth, trimmedEmail, trimmedPassword);
  const authUid = result.user.uid;
  const document = forNewRegistration(authUid, trimmedEmail, name.trim());
  await writeNewUserDocument(document);
  return document;
}

export async function signInWithEmail(
  email: string,
  password: string,
): Promise<UserDocument> {
  const auth = getFirebaseAuth();
  const result = await signInWithEmailAndPassword(
    auth,
    email.trim(),
    password.trim(),
  );
  // Profile is keyed by Auth UID from the signed-in user, not by email.
  return loadAndEnforceLogin(result.user);
}

export async function signInWithGoogle(): Promise<UserDocument> {
  const auth = getFirebaseAuth();
  const provider = new GoogleAuthProvider();
  const result = await signInWithPopup(auth, provider);
  const authUid = result.user.uid;
  const existing = await loadUserDocument(authUid);
  if (!existing) {
    await writeNewUserDocument(
      forNewRegistration(
        authUid,
        result.user.email ?? "",
        result.user.displayName?.trim() || result.user.email || "",
      ),
    );
  }
  return loadAndEnforceLogin(result.user);
}

export async function signOut(): Promise<void> {
  await firebaseSignOut(getFirebaseAuth());
}

export function subscribeToAuth(onChange: (user: User | null) => void): () => void {
  return onAuthStateChanged(getFirebaseAuth(), onChange);
}
