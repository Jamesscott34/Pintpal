/**
 * page.tsx
 *
 * Purpose: Server-rendered public home page for PintPal web (crawlable HTML for search engines).
 * Connects to: App Router root. Links into auth routes under /login and /register.
 * Notes: No client Firebase calls here. Keep public marketing content server-rendered.
 */

import Link from "next/link";
import styles from "./page.module.css";

export default function Home() {
  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <div className={styles.intro}>
          <p className={styles.brand}>PintPal</p>
          <h1>Discover, rate, and share drinks</h1>
          <p>
            PintPal is a multi-user drinks discovery platform. Public category
            pages and search come in Phase 1; this home page is server-rendered
            HTML so search engines and Google Search Console can index it.
          </p>
          <p>
            <Link href="/login">Sign in</Link>
            {" · "}
            <Link href="/register">Create account</Link>
          </p>
        </div>
      </main>
    </div>
  );
}
