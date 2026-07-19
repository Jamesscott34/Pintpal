/**
 * page.tsx
 *
 * Purpose: Server-rendered public home page for PintPal web (crawlable HTML for search engines).
 * Connects to: App Router root. Links into auth and Public/Private sections.
 * Notes: No client Firebase calls here. Keep public marketing content server-rendered.
 */

import Link from "next/link";
import styles from "./page.module.css";

export default function Home() {
  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <div className={styles.intro}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            className={styles.logo}
            src="/pintpal-icon.png"
            alt="PintPal"
            width={72}
            height={72}
          />
          <p className={styles.brand}>PintPal</p>
          <h1>Discover, rate, and share drinks</h1>
          <p>
            Sign in to open Public (games, chats, ratings, scoreboard) or Private
            (your profile).
          </p>
          <p>
            <Link href="/login">Sign in</Link>
            {" · "}
            <Link href="/register">Create account</Link>
            {" · "}
            <Link href="/public">Public</Link>
            {" · "}
            <Link href="/private">Private</Link>
          </p>
        </div>
      </main>
    </div>
  );
}
