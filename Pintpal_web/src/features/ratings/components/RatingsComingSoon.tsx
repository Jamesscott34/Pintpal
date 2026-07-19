/**
 * RatingsComingSoon.tsx
 *
 * Purpose: Public beer ratings placeholder until Phase 1 ratings ship.
 * Connects to: /ratings route via AppShell.
 */

"use client";

import Link from "next/link";
import styles from "@/features/app_shell/components/PublicHub.module.css";

export function RatingsComingSoon() {
  return (
    <div className={styles.hub}>
      <p className={styles.eyebrow}>Public</p>
      <h1 className={styles.title}>Beer ratings</h1>
      <p className={styles.lead}>
        Rate and review beers, cider, wine, and spirits. Full ratings and
        rankings are coming soon — this space is ready for every signed-in
        member.
      </p>
      <Link className={styles.item} href="/public">
        <span className={styles.itemTitle}>Back to Public</span>
        <span className={styles.itemMeta}>Games, chats, and scoreboard</span>
      </Link>
    </div>
  );
}
