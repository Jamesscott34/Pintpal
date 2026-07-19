/**
 * useAuth.ts
 *
 * Purpose: Client hook for Firebase auth session + Firestore users document flags.
 * Connects to: features/auth/data/authRepository. Used by LoginForm, RegisterForm,
 *              AccountPanel, and gated pages.
 * Notes: Enforces canLogin after auth. Exposes canViewAdmin for admin UI gating.
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
import {
  canLogin as checkCanLogin,
  canViewAdmin as checkCanViewAdmin,
} from "@/utilities/permissions";

type UseAuthResult = {
  firebaseUser: User | null;
  userDocument: UserDocument | null;
  isLoading: boolean;
  errorMessage: string | null;
  canLogin: boolean;
  canViewAdmin: boolean;
  register: (email: string, password: string, name: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signInGoogle: () => Promise<void>;
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
        const document = await loadAndEnforceLogin(user);
        setUserDocument(document);
      } catch (error) {
        setUserDocument(null);
        setFirebaseUser(null);
        setErrorMessage(
          error instanceof Error ? error.message : "Unable to load account permissions.",
        );
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
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Registration failed.");
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
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Sign-in failed.");
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
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Google sign-in failed.");
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

  return {
    firebaseUser,
    userDocument,
    isLoading,
    errorMessage,
    canLogin: checkCanLogin(userDocument),
    canViewAdmin: checkCanViewAdmin(userDocument),
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
