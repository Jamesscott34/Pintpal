/**
 * PublicTopScoreboard.tsx
 *
 * Purpose: Top-of-Public highlights — best pint + Serving Rush leaders with display names.
 * Connects to: pour + serving public score repositories.
 */

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { loadPublicPourScoreboard } from "@/features/pour_game/data/pourGameScoreRepository";
import { loadPublicServingScoreboard } from "@/features/serving_game/data/servingGameScoreRepository";
import styles from "./PublicTopScoreboard.module.css";

type Highlight = {
  title: string;
  name: string;
  scoreLabel: string;
  href: string;
};

export function PublicTopScoreboard() {
  const [highlights, setHighlights] = useState<Highlight[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const next: Highlight[] = [];
      try {
        const pour = await loadPublicPourScoreboard("practice");
        const best = pour[0];
        if (best) {
          next.push({
            title: "Best pint",
            name: best.displayName,
            scoreLabel: `${Math.round(best.score)}% Perfect Pour Accuracy`,
            href: "/games/pour",
          });
        }
      } catch {
        /* board may need indexes; keep hub usable */
      }
      try {
        const serving = await loadPublicServingScoreboard();
        const best = serving[0];
        if (best) {
          next.push({
            title: "Serving Rush lead",
            name: best.displayName,
            scoreLabel: `${Math.round(best.score)} pts`,
            href: "/games/serving",
          });
        }
      } catch {
        /* ignore */
      }
      if (!cancelled) {
        setHighlights(next);
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section className={styles.board} aria-label="Community scoreboard highlights">
      <h2 className={styles.title}>Scoreboard</h2>
      <p className={styles.lead}>
        Top public opt-in scores — player name shown with each highlight.
      </p>
      {loading ? <p className={styles.meta}>Loading standings…</p> : null}
      {!loading && highlights.length === 0 ? (
        <p className={styles.meta}>
          No public scores yet. Play a game and opt in on the scoreboard to appear
          here.
        </p>
      ) : null}
      <ul className={styles.list}>
        {highlights.map((item) => (
          <li key={item.title} className={styles.card}>
            <p className={styles.cardTitle}>{item.title}</p>
            <p className={styles.name}>{item.name}</p>
            <p className={styles.score}>{item.scoreLabel}</p>
            <Link className={styles.link} href={item.href}>
              Open board
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
