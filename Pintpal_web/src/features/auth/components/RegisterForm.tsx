/**
 * RegisterForm.tsx
 *
 * Purpose: Client form for email/password registration (web).
 * Connects to: useAuth hook; routed from app/register/page.tsx.
 * Notes: Creates Firestore users doc with canLogin=true, canViewAdmin=false, role=user.
 */

"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { useAuth } from "@/features/auth/hooks";
import styles from "./AuthForms.module.css";

export function RegisterForm() {
  const router = useRouter();
  const { register, isLoading, errorMessage, clearError } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    clearError();
    try {
      await register(email, password, name);
      router.push("/account");
    } catch {
      // errorMessage set in hook
    }
  }

  return (
    <div className={styles.panel}>
      <form className={styles.card} onSubmit={onSubmit}>
        <p className={styles.brand}>PintPal</p>
        <h1 className={styles.title}>Create account</h1>
        <label className={styles.label}>
          Display name
          <input
            className={styles.input}
            type="text"
            autoComplete="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </label>
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
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
          />
        </label>
        {errorMessage ? <p className={styles.error}>{errorMessage}</p> : null}
        <button className={styles.button} type="submit" disabled={isLoading}>
          {isLoading ? "Please wait…" : "Create account"}
        </button>
        <Link className={styles.link} href="/login">
          Already have an account? Sign in
        </Link>
      </form>
    </div>
  );
}
