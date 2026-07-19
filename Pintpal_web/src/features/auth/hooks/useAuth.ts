/**
 * useAuth.ts
 *
 * Purpose: Client hook for Firebase auth session + Firestore users document flags.
 * Connects to: features/auth/data/authRepository. Used by LoginForm, RegisterForm,
 *              AccountPanel, and gated pages.
 * Notes: Enforces canLogin after auth. Exposes canViewAdmin and subscription (paid/free).
 */

"use client";

import { useCallback, useEffect, useState } from "react";
import type { User } from "firebase/auth";
import {
  loadAndEnforceLogin,
  loadUserDocument,
  registerWithEmail,
  signInWithEmail,
  signInWithGoogle,
  signOut,
  subscribeToAuth,
} from "@/features/auth/data";
import type { UserDocument } from "@/features/auth/types";
import { mapAuthError } from "@/utilities/authErrors";
import {
  canLogin as checkCanLogin,
  canUploadPhoto as checkCanUploadPhoto,
  canViewAdmin as checkCanViewAdmin,
  isSubscriptionPaid as checkIsSubscriptionPaid,
  remainingPhotoUploadsToday,
  subscriptionLabel,
} from "@/utilities/permissions";

type UseAuthResult = {
  firebaseUser: User | null;
  userDocument: UserDocument | null;
  isLoading: boolean;
  errorMessage: string | null;
  canLogin: boolean;
  canViewAdmin: boolean;
  /** Effective paid status (admin always paid). */
  isSubscriptionPaid: boolean;
  subscription: "paid" | "free";
  canUploadPhoto: boolean;
  remainingPhotoUploadsToday: number;
  register: (email: string, password: string, name: string) => Promise<UserDocument>;
  signIn: (email: string, password: string) => Promise<UserDocument>;
  signInGoogle: () => Promise<UserDocument>;
  signOutUser: () => Promise<void>;
  clearError: () => void;
};

export function useAuth(): UseAuthResult {
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [userDocument, setUserDocument] = useState<UserDocument | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = subscribeToAuth(async (user) => {
      setFirebaseUser(user);
      if (!user) {
        setUserDocument(null);
        setIsLoading(false);
        return;
      }
      try {
        // Always load Firestore users/{user.uid} for the authenticated Auth UID.
        const document = await loadAndEnforceLogin(user);
        setUserDocument(document);
        setFirebaseUser(user);
      } catch (error) {
        setUserDocument(null);
        setFirebaseUser(null);
        setErrorMessage(mapAuthError(error));
      } finally {
        setIsLoading(false);
      }
    });
    return unsubscribe;
  }, []);

  const register = useCallback(async (email: string, password: string, name: string) => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const document = await registerWithEmail(email, password, name);
      setUserDocument(document);
      return document;
    } catch (error) {
      setErrorMessage(mapAuthError(error));
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const document = await signInWithEmail(email, password);
      setUserDocument(document);
      return document;
    } catch (error) {
      setErrorMessage(mapAuthError(error));
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const signInGoogle = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const document = await signInWithGoogle();
      setUserDocument(document);
      return document;
    } catch (error) {
      setErrorMessage(mapAuthError(error));
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const signOutUser = useCallback(async () => {
    await signOut();
    setUserDocument(null);
    setFirebaseUser(null);
  }, []);

  const remaining = remainingPhotoUploadsToday(userDocument);

  return {
    firebaseUser,
    userDocument,
    isLoading,
    errorMessage,
    canLogin: checkCanLogin(userDocument),
    canViewAdmin: checkCanViewAdmin(userDocument),
    isSubscriptionPaid: checkIsSubscriptionPaid(userDocument),
    subscription: subscriptionLabel(userDocument),
    canUploadPhoto: checkCanUploadPhoto(userDocument),
    remainingPhotoUploadsToday: Number.isFinite(remaining) ? remaining : Number.POSITIVE_INFINITY,
    register,
    signIn,
    signInGoogle,
    signOutUser,
    clearError: () => setErrorMessage(null),
  };
}

export async function refreshUserDocument(uid: string): Promise<UserDocument | null> {
  return loadUserDocument(uid);
}
