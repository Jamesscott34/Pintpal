/**
 * PourMechanicDemo.tsx
 *
 * Purpose: Stage 1 verification UI — live pour + fixed-input scorer consistency check.
 * Connects to: /games/demo page; scorePour pure function.
 * Notes: "Run consistency check" re-scores the same snapshot three times; results must match.
 */

"use client";

import { useMemo, useState } from "react";
import { scorePour } from "../scorePour";
import type { PourConfig, PourState } from "../types";
import { DEFAULT_POUR_CONFIG } from "../types";
import { PourGlass } from "./PourGlass";
import styles from "./PourMechanicDemo.module.css";

const FIXTURE_STATE: PourState = {
  liquidLevel: 0.72,
  headSize: 0.18,
  isPouring: false,
  isOverflowed: false,
};

const FIXTURE_CONFIG: PourConfig = { ...DEFAULT_POUR_CONFIG };

export function PourMechanicDemo() {
  const [checkLines, setCheckLines] = useState<string[]>([]);

  const easyConfig = useMemo(
    () => ({
      pourSpeed: 0.28,
      headRatio: 0.22,
      liquidTolerance: 0.08,
      headTolerance: 0.06,
    }),
    [],
  );

  function runConsistencyCheck() {
    const a = scorePour(FIXTURE_STATE, FIXTURE_CONFIG);
    const b = scorePour(FIXTURE_STATE, FIXTURE_CONFIG);
    const c = scorePour(FIXTURE_STATE, FIXTURE_CONFIG);
    const same =
      a.overallAccuracyPercent === b.overallAccuracyPercent &&
      b.overallAccuracyPercent === c.overallAccuracyPercent &&
      a.feedback === b.feedback &&
      b.feedback === c.feedback;
    setCheckLines([
      `Run 1: ${a.feedbackLabel}`,
      `Run 2: ${b.feedbackLabel}`,
      `Run 3: ${c.feedbackLabel}`,
      same
        ? "PASS — identical scores across three runs for the same input."
        : "FAIL — scores diverged; scorer must be deterministic.",
    ]);
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <p className={styles.brand}>PintPal</p>
        <h1>Pour mechanic demo</h1>
        <p className={styles.sub}>
          Stage 1 shared bartender pour skill — fill animation, timing input,
          and Perfect Pour Accuracy scoring.
        </p>
      </header>

      <PourGlass config={easyConfig} />

      <section className={styles.check}>
        <h2>Scorer consistency</h2>
        <p>
          Fixed snapshot: liquid {FIXTURE_STATE.liquidLevel}, head{" "}
          {FIXTURE_STATE.headSize}. Re-score three times; results must match.
        </p>
        <button type="button" onClick={runConsistencyCheck}>
          Run consistency check
        </button>
        {checkLines.length > 0 ? (
          <ul>
            {checkLines.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        ) : null}
      </section>
    </div>
  );
}
