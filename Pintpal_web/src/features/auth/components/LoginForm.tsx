/**
 * LoginForm.tsx
 *
 * Purpose: Client form for email/password and Google sign-in (web).
 * Connects to: useAuth hook; routed from app/login/page.tsx.
 * Notes: Redirects to /account when canLogin is true after success.
 */

"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { useAuth } from "@/features/auth/hooks";
import styles from "./AuthForms.module.css";

export function LoginForm() {
  const router = useRouter();
  const { signIn, signInGoogle, isLoading, errorMessage, clearError } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    clearError();
    try {
      await signIn(email, password);
      router.push("/account");
    } catch {
      // errorMessage set in hook
    }
  }

  async function onGoogle() {
    clearError();
    try {
      await signInGoogle();
      router.push("/account");
    } catch {
      // errorMessage set in hook
    }
  }

  return (
    <div className={styles.panel}>
      <form className={styles.card} onSubmit={onSubmit}>
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
