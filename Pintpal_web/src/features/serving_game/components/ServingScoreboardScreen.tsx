/**
 * ServingScoreboardScreen.tsx
 *
 * Purpose: Public Serving Rush standings (opt-in), separate from pour scores.
 */

"use client";

import { useEffect, useState } from "react";
import {
  loadPublicServingScoreboard,
  type ServingScoreboardEntry,
} from "../data/servingGameScoreRepository";
import styles from "./ServingScoreboardScreen.module.css";

export function ServingScoreboardScreen() {
  const [rows, setRows] = useState<ServingScoreboardEntry[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const list = await loadPublicServingScoreboard();
        if (!cancelled) setRows(list);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Could not load scoreboard.");
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className={styles.screen}>
      <h1 className={styles.title}>Serving Rush scoreboard</h1>
      <p className={styles.lead}>
        Public opt-in standings. Separate from Pour the Perfect Pint and beer ratings.
      </p>
      {error ? <p className={styles.error}>{error}</p> : null}
      <ol className={styles.list}>
        {rows.map((row, index) => (
          <li key={row.id} className={styles.row}>
            <span className={styles.rank}>{index + 1}</span>
            <span className={styles.name}>{row.displayName}</span>
            <span className={styles.score}>{Math.round(row.score)}</span>
          </li>
        ))}
      </ol>
      {!error && rows.length === 0 ? (
        <p className={styles.lead}>No public Serving Rush scores yet.</p>
      ) : null}
    </div>
  );
}
