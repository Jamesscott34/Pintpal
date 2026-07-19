/**
 * AccountPanel.tsx
 *
 * Purpose: Private profile for the signed-in user.
 * Connects to: useAuth; /private. Admins also get a link to /admin.
 * Notes: Regular users never see UID, Firestore paths, or permission flag names.
 *        Admins may see those details for support / diagnostics.
 */

"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "@/features/auth/hooks";
import styles from "./AuthForms.module.css";

type AccountPanelProps = {
  /** When true, render profile content only (AppShell provides chrome). */
  embedded?: boolean;
};

export function AccountPanel({ embedded = false }: AccountPanelProps) {
  const router = useRouter();
  const {
    firebaseUser,
    userDocument,
    isLoading,
    canViewAdmin: showAdmin,
    subscription,
    isSubscriptionPaid: paid,
    remainingPhotoUploadsToday: photosLeft,
    signOutUser,
  } = useAuth();

  useEffect(() => {
    if (!isLoading && !userDocument) {
      router.replace("/login");
    }
  }, [isLoading, userDocument, router]);

  if (isLoading || !userDocument) {
    const loading = (
      <div className={embedded ? undefined : styles.card}>
        <p className={styles.meta}>Loading account…</p>
      </div>
    );
    return embedded ? loading : <div className={styles.panel}>{loading}</div>;
  }

  const authUid = firebaseUser?.uid ?? userDocument.uid;
  const photoLine = paid
    ? "Unlimited photo uploads"
    : `${Number.isFinite(photosLeft) ? photosLeft : 0} of 2 free photos left today`;

  const body = (
    <div className={embedded ? styles.embeddedCard : styles.card}>
      {!embedded ? (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            className={styles.logo}
            src="/pintpal-icon.png"
            alt="PintPal"
            width={72}
            height={72}
          />
          <p className={styles.brand}>PintPal</p>
        </>
      ) : (
        <p className={styles.brand}>Private</p>
      )}
      <h1 className={styles.title}>Your profile</h1>
      <p className={styles.meta}>
        <strong>{userDocument.name}</strong>
        <br />
        {userDocument.email}
        <br />
        Plan: {subscription === "paid" ? "Paid" : "Free"}
        <br />
        {photoLine}
      </p>

      {showAdmin ? (
        <>
          <p className={styles.meta}>
            <strong>Admin details</strong>
            <br />
            UID: {authUid}
            <br />
            Role: {userDocument.role}
            <br />
            canLogin: {String(userDocument.canLogin)}
            <br />
            canViewAdmin: true
          </p>
          <Link className={styles.button} href="/admin">
            Open admin dashboard
          </Link>
        </>
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
      <Link className={styles.link} href="/public">
        Back to Public
      </Link>
    </div>
  );

  return embedded ? body : <div className={styles.panel}>{body}</div>;
}
