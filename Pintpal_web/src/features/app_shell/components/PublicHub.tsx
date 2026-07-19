/**
 * PublicHub.tsx
 *
 * Purpose: Public community landing — scoreboard highlights first, then games/chats/ratings.
 */

"use client";

import Link from "next/link";
import { PublicTopScoreboard } from "./PublicTopScoreboard";
import styles from "./PublicHub.module.css";

export function PublicHub() {
  return (
    <div className={styles.hub}>
      <p className={styles.eyebrow}>Public</p>
      <h1 className={styles.title}>Community</h1>
      <p className={styles.lead}>
        Games, chats, Best Pints photos, and scoreboards. Your private profile is under
        Private.
      </p>

      <PublicTopScoreboard />

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Games</h2>
        <ul className={styles.list}>
          <li>
            <Link className={styles.item} href="/games/pour">
              <span className={styles.itemTitle}>Pour the Perfect Pint</span>
              <span className={styles.itemMeta}>
                Practice, timed heats, and scoreboard
              </span>
            </Link>
          </li>
          <li>
            <Link className={styles.item} href="/games/tilt">
              <span className={styles.itemTitle}>Tilt the Pint</span>
              <span className={styles.itemMeta}>
                Drag or tip the glass to fill — shared with Serving Rush
              </span>
            </Link>
          </li>
          <li>
            <Link className={styles.item} href="/games/serving">
              <span className={styles.itemTitle}>Serving Rush</span>
              <span className={styles.itemMeta}>
                Correct tap, then tilt-pour before the clock
              </span>
            </Link>
          </li>
          <li>
            <Link className={styles.item} href="/games/demo">
              <span className={styles.itemTitle}>Pour mechanic demo</span>
              <span className={styles.itemMeta}>Fill animation & accuracy scorer</span>
            </Link>
          </li>
        </ul>
      </section>

      <section className={styles.section} id="chats">
        <h2 className={styles.sectionTitle}>Chats</h2>
        <p className={styles.placeholder}>
          Category chats and discussions will appear here. Coming soon.
        </p>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Best Pints</h2>
        <ul className={styles.list}>
          <li>
            <Link className={styles.item} href="/ratings">
              <span className={styles.itemTitle}>Upload &amp; rate pint photos</span>
              <span className={styles.itemMeta}>
                Score out of 10 · daily winners · weekly top 3 vote
              </span>
            </Link>
          </li>
        </ul>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Beer ratings</h2>
        <ul className={styles.list}>
          <li>
            <Link className={styles.item} href="/drinks">
              <span className={styles.itemTitle}>Rate beers &amp; mixes</span>
              <span className={styles.itemMeta}>
                e.g. Heineken with lemon · nicest so far · similar suggestions
              </span>
            </Link>
          </li>
        </ul>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Full scoreboards</h2>
        <ul className={styles.list}>
          <li>
            <Link className={styles.item} href="/games/pour">
              <span className={styles.itemTitle}>Pour scoreboard</span>
              <span className={styles.itemMeta}>Perfect Pour Accuracy standings</span>
            </Link>
          </li>
          <li>
            <Link className={styles.item} href="/games/serving">
              <span className={styles.itemTitle}>Serving Rush scoreboard</span>
              <span className={styles.itemMeta}>Rush points standings</span>
            </Link>
          </li>
        </ul>
      </section>
    </div>
  );
}
