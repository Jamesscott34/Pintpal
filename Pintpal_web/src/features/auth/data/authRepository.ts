/**
 * authRepository.ts
 *
 * Purpose: Firebase Authentication wrapper for the auth feature (web).
 * Connects to: Firebase Auth web SDK. Used by useAuth hook (features/auth/hooks).
 *              Writes to Firestore "users" on registration, mirroring Android AuthRepository
 *              so both clients create identical documents.
 * Notes: Client-side only. Never sets role=admin or canViewAdmin=true on registration.
 *        Sign-in is rejected (and signed out) when canLogin is false.
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
import { Collections } from "@/utilities/firebaseConstants";
import { canLogin } from "@/utilities/permissions";
import type { UserDocument } from "@/features/auth/types";

export class LoginDeniedError extends Error {
  constructor(message = "This account is not allowed to sign in (canLogin is false).") {
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
  return {
    uid,
    email: typeof data?.email === "string" ? data.email : "",
    name: typeof data?.name === "string" ? data.name : "",
    role: typeof data?.role === "string" ? data.role : "user",
    canLogin: data?.canLogin === true,
    canViewAdmin: data?.canViewAdmin === true,
    pourGameBestPracticeAccuracy:
      typeof practice === "number" ? practice : null,
    pourGameBestTimedAccuracySums: timed,
    pourGameScoreboardOptIn: data?.pourGameScoreboardOptIn === true,
  };
}

async function writeUserDocument(document: UserDocument): Promise<void> {
  const db = getFirebaseFirestore();
  await setDoc(doc(db, Collections.users, document.uid), {
    email: document.email,
    name: document.name,
    role: document.role,
    canLogin: document.canLogin,
    canViewAdmin: document.canViewAdmin,
  });
}

export async function loadAndEnforceLogin(user: User): Promise<UserDocument> {
  const db = getFirebaseFirestore();
  const auth = getFirebaseAuth();
  const snapshot = await getDoc(doc(db, Collections.users, user.uid));
  let document: UserDocument;
  if (snapshot.exists()) {
    document = fromFirestore(user.uid, snapshot.data() as Record<string, unknown>);
  } else {
    document = forNewRegistration(
      user.uid,
      user.email ?? "",
      user.displayName?.trim() || user.email || "",
    );
    await writeUserDocument(document);
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
  const result = await createUserWithEmailAndPassword(auth, email.trim(), password);
  const document = forNewRegistration(result.user.uid, email.trim(), name.trim());
  await writeUserDocument(document);
  return document;
}

export async function signInWithEmail(
  email: string,
  password: string,
): Promise<UserDocument> {
  const auth = getFirebaseAuth();
  const result = await signInWithEmailAndPassword(auth, email.trim(), password);
  return loadAndEnforceLogin(result.user);
}

export async function signInWithGoogle(): Promise<UserDocument> {
  const auth = getFirebaseAuth();
  const provider = new GoogleAuthProvider();
  const result = await signInWithPopup(auth, provider);
  const db = getFirebaseFirestore();
  const existing = await getDoc(doc(db, Collections.users, result.user.uid));
  if (!existing.exists()) {
    await writeUserDocument(
      forNewRegistration(
        result.user.uid,
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

export async function loadUserDocument(uid: string): Promise<UserDocument | null> {
  const snapshot = await getDoc(doc(getFirebaseFirestore(), Collections.users, uid));
  if (!snapshot.exists()) return null;
  return fromFirestore(uid, snapshot.data() as Record<string, unknown>);
}
