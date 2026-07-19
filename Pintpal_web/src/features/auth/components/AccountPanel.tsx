/**
 * AccountPanel.tsx
 *
 * Purpose: Shows signed-in user profile flags and sign-out control.
 * Connects to: useAuth; routed from app/account/page.tsx.
 * Notes: Admin UI is only hinted when canViewAdmin is true (no admin routes yet).
 */

"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "@/features/auth/hooks";
import styles from "./AuthForms.module.css";

export function AccountPanel() {
  const router = useRouter();
  const {
    userDocument,
    isLoading,
    canLogin: allowed,
    canViewAdmin: showAdmin,
    signOutUser,
  } = useAuth();

  useEffect(() => {
    if (!isLoading && !userDocument) {
      router.replace("/login");
    }
  }, [isLoading, userDocument, router]);

  if (isLoading || !userDocument) {
    return (
      <div className={styles.panel}>
        <div className={styles.card}>
          <p className={styles.meta}>Loading account…</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.panel}>
      <div className={styles.card}>
        <p className={styles.brand}>PintPal</p>
        <h1 className={styles.title}>Your account</h1>
        <p className={styles.meta}>
          <strong>{userDocument.name}</strong>
          <br />
          {userDocument.email}
          <br />
          Role: {userDocument.role}
          <br />
          canLogin: {String(allowed)}
          <br />
          canViewAdmin: {String(showAdmin)}
        </p>
        {showAdmin ? (
          <p className={styles.meta}>Admin access is enabled for this account.</p>
        ) : null}
        <button
          className={styles.buttonSecondary}
          type="button"
          onClick={async () => {
            await signOutUser();
            router.push("/login");
          }}
        >
          Sign out
        </button>
        <Link className={styles.link} href="/">
          Back to home
        </Link>
      </div>
    </div>
  );
}
