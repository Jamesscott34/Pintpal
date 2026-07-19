/**
 * TiltPourScreen.tsx
 *
 * Purpose: Standalone tilt-to-pour skill game.
 * Connects to: TiltPourGlass; Public hub /games/tilt.
 */

"use client";

import { useState } from "react";
import { TiltPourGlass } from "@/features/games_common/components";
import type { PourScore } from "@/features/games_common/types";
import styles from "./TiltPourScreen.module.css";

export function TiltPourScreen() {
  const [last, setLast] = useState<PourScore | null>(null);
  const [resetKey, setResetKey] = useState(0);

  return (
    <div className={styles.page}>
      <p className={styles.brand}>PintPal</p>
      <h1 className={styles.title}>Tilt the Pint</h1>
      <p className={styles.lead}>
        Tilt the glass to an angle, save it, then tap to pour. Stop near the
        ideal band for Perfect Pour Accuracy.
      </p>
      <TiltPourGlass
        resetKey={resetKey}
        onScore={(score) => setLast(score)}
      />
      {last ? (
        <button
          type="button"
          className={styles.again}
          onClick={() => {
            setLast(null);
            setResetKey((k) => k + 1);
          }}
        >
          Pour again
        </button>
      ) : null}
    </div>
  );
}
