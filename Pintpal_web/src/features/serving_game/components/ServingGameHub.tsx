/**
 * ServingGameHub.tsx
 *
 * Purpose: Mode picker for Serving Rush (play + scoreboard).
 */

"use client";

import { useState } from "react";
import { ServingRushScreen } from "./ServingRushScreen";
import { ServingScoreboardScreen } from "./ServingScoreboardScreen";
import styles from "./ServingGameHub.module.css";

type Mode = "pick" | "play" | "scoreboard";

export function ServingGameHub() {
  const [mode, setMode] = useState<Mode>("pick");

  if (mode === "play") {
    return (
      <div>
        <button type="button" className={styles.back} onClick={() => setMode("pick")}>
          ← Modes
        </button>
        <ServingRushScreen />
      </div>
    );
  }

  if (mode === "scoreboard") {
    return (
      <div>
        <button type="button" className={styles.back} onClick={() => setMode("pick")}>
          ← Modes
        </button>
        <ServingScoreboardScreen />
      </div>
    );
  }

  return (
    <div className={styles.hub}>
      <p className={styles.brand}>PintPal</p>
      <h1 className={styles.title}>Serving Rush</h1>
      <p className={styles.lead}>
        Multi-order bartender skill — correct tap, accurate pour, beat the clock.
      </p>
      <div className={styles.actions}>
        <button type="button" onClick={() => setMode("play")}>
          Play
        </button>
        <button type="button" onClick={() => setMode("scoreboard")}>
          Scoreboard
        </button>
      </div>
    </div>
  );
}
