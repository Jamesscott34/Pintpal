/**
 * LoginForm.tsx
 *
 * Purpose: Client form for email/password and Google sign-in (web).
 * Connects to: useAuth hook; routed from app/login/page.tsx.
 * Notes: After Auth succeeds, profile is loaded from Firestore users/{auth.uid}.
 *        Redirects to /account when canLogin is true.
 */

"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { getFirebaseAuth } from "@/utilities/firebase";
import { useAuth } from "@/features/auth/hooks";
import styles from "./AuthForms.module.css";

export function LoginForm() {
  const router = useRouter();
  const { signIn, signInGoogle, isLoading, errorMessage, clearError } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  function assertProfileMatchesAuthUid(profileUid: string) {
    const authUid = getFirebaseAuth().currentUser?.uid;
    if (!authUid || authUid !== profileUid) {
      throw new Error("Sign-in could not verify your account. Please try again.");
    }
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    clearError();
    try {
      const profile = await signIn(email, password);
      assertProfileMatchesAuthUid(profile.uid);
      router.push("/public");
    } catch {
      // errorMessage set in hook — shown inline, never as a browser popup
    }
  }

  async function onGoogle() {
    clearError();
    try {
      const profile = await signInGoogle();
      assertProfileMatchesAuthUid(profile.uid);
      router.push("/public");
    } catch {
      // errorMessage set in hook — shown inline, never as a browser popup
    }
  }

  return (
    <div className={styles.panel}>
      <form className={styles.card} onSubmit={onSubmit}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          className={styles.logo}
          src="/pintpal-icon.png"
          alt="PintPal"
          width={72}
          height={72}
        />
        <p className={styles.brand}>PintPal</p>
        <h1 className={styles.title}>Sign in</h1>
        <label className={styles.label}>
          Email
          <input
            className={styles.input}
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </label>
        <label className={styles.label}>
          Password
          <input
            className={styles.input}
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </label>
        {errorMessage ? <p className={styles.error}>{errorMessage}</p> : null}
        <button className={styles.button} type="submit" disabled={isLoading}>
          {isLoading ? "Please wait…" : "Sign in"}
        </button>
        <button
          className={styles.buttonSecondary}
          type="button"
          onClick={onGoogle}
          disabled={isLoading}
        >
          Continue with Google
        </button>
        <Link className={styles.link} href="/register">
          Need an account? Register
        </Link>
      </form>
    </div>
  );
}
