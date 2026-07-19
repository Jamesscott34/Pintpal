/**
 * PourGameHub.tsx
 *
 * Purpose: Mode picker for Pour the Perfect Pint (practice vs timed).
 * Connects to: app/games/pour/page.tsx; PracticePourScreen, TimedPourScreen.
 */

"use client";

import { useState } from "react";
import { PracticePourScreen } from "./PracticePourScreen";
import { TimedPourScreen } from "./TimedPourScreen";
import { PourScoreboardScreen } from "./PourScoreboardScreen";
import styles from "./PourGameHub.module.css";

type Mode = "pick" | "practice" | "timed" | "scoreboard";

export function PourGameHub() {
  const [mode, setMode] = useState<Mode>("pick");

  if (mode === "practice") {
    return (
      <div>
        <button
          type="button"
          className={styles.back}
          onClick={() => setMode("pick")}
        >
          ← Modes
        </button>
        <PracticePourScreen />
      </div>
    );
  }

  if (mode === "timed") {
    return (
      <div>
        <button
          type="button"
          className={styles.back}
          onClick={() => setMode("pick")}
        >
          ← Modes
        </button>
        <TimedPourScreen />
      </div>
    );
  }

  if (mode === "scoreboard") {
    return (
      <div>
        <button
          type="button"
          className={styles.back}
          onClick={() => setMode("pick")}
        >
          ← Modes
        </button>
        <PourScoreboardScreen />
      </div>
    );
  }

  return (
    <div className={styles.hub}>
      <p className={styles.brand}>PintPal</p>
      <h1>Pour the Perfect Pint</h1>
      <p className={styles.sub}>
        Bartender pour skill challenges — Perfect Pour Accuracy only, never
        drinking speed or volume.
      </p>
      <div className={styles.actions}>
        <button type="button" onClick={() => setMode("practice")}>
          Practice (progressive)
        </button>
        <button type="button" onClick={() => setMode("timed")}>
          Timed run
        </button>
        <button type="button" onClick={() => setMode("scoreboard")}>
          Public scoreboard
        </button>
      </div>
    </div>
  );
}
