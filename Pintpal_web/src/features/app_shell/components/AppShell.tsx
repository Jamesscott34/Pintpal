/**
 * AppShell.tsx
 *
 * Purpose: Shared top nav — Public, Private, and Admin (when canViewAdmin).
 * Connects to: /public, /private, /admin, games, ratings.
 * Notes: Requires canLogin === true. Admin tab is hidden from regular users.
 */

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { useAuth } from "@/features/auth/hooks";
import styles from "./AppShell.module.css";

type AppShellProps = {
  children: ReactNode;
  section?: "public" | "private" | "admin";
};

export function AppShell({ children, section }: AppShellProps) {
  const pathname = usePathname();
  const {
    isLoading,
    userDocument,
    canLogin: allowed,
    canViewAdmin,
    subscription,
  } = useAuth();

  const activePublic =
    section === "public" ||
    pathname?.startsWith("/public") ||
    pathname?.startsWith("/games") ||
    pathname?.startsWith("/ratings") ||
    pathname?.startsWith("/drinks");
  const activePrivate =
    section === "private" ||
    pathname?.startsWith("/private") ||
    pathname?.startsWith("/account");
  const activeAdmin = section === "admin" || pathname?.startsWith("/admin");

  if (isLoading) {
    return (
      <div className={styles.shell}>
        <p className={styles.meta}>Loading…</p>
      </div>
    );
  }

  if (!userDocument || !allowed) {
    return (
      <div className={styles.shell}>
        <div className={styles.gate}>
          <p className={styles.brand}>PintPal</p>
          <h1 className={styles.title}>Sign in required</h1>
          <p className={styles.meta}>
            You need an account with login enabled to open this section.
          </p>
          <Link className={styles.link} href="/login">
            Sign in
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.shell}>
      <header className={styles.header}>
        <Link className={styles.logoLink} href="/public">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            className={styles.logo}
            src="/pintpal-icon.png"
            alt="PintPal"
            width={40}
            height={40}
          />
          <span className={styles.brand}>PintPal</span>
        </Link>
        <nav className={styles.nav} aria-label="App sections">
          <Link
            className={activePublic ? styles.navActive : styles.navLink}
            href="/public"
          >
            Public
          </Link>
          <Link
            className={activePrivate ? styles.navActive : styles.navLink}
            href="/private"
          >
            Private
          </Link>
          {canViewAdmin ? (
            <Link
              className={activeAdmin ? styles.navActive : styles.navLink}
              href="/admin"
            >
              Admin
            </Link>
          ) : null}
        </nav>
        <p className={styles.userMeta}>
          {userDocument.name || userDocument.email}
          {" · "}
          {subscription === "paid" ? "Paid" : "Free"}
        </p>
      </header>
      <main className={styles.main}>{children}</main>
    </div>
  );
}
