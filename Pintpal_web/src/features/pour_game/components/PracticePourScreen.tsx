/**
 * PracticePourScreen.tsx
 *
 * Purpose: Practice mode with progressive difficulty (no timer).
 * Connects to: useTwoPartPour, practiceDifficulty; PourGameHub.
 * Notes: Clearing a level (Perfect Pour Accuracy >= threshold) unlocks a harder level.
 */

"use client";

import { useCallback, useState } from "react";
import { displayLevels } from "@/features/games_common/advancePour";
import type { PourScore } from "@/features/games_common/types";
import { useTwoPartPour } from "../hooks/useTwoPartPour";
import {
  getPracticeLevel,
  isPracticeSuccess,
  nextPracticeLevel,
  PRACTICE_SUCCESS_THRESHOLD,
} from "../practiceDifficulty";
import { submitPourScore } from "../data/pourGameScoreRepository";
import styles from "./PracticePourScreen.module.css";

export function PracticePourScreen() {
  const [level, setLevel] = useState(1);
  const [clearedMessage, setClearedMessage] = useState<string | null>(null);
  const difficulty = getPracticeLevel(level);

  const onComplete = useCallback((score: PourScore) => {
    if (isPracticeSuccess(score.overallAccuracyPercent)) {
      const next = nextPracticeLevel(level);
      if (next.level > level) {
        setLevel(next.level);
        setClearedMessage(
          `Level ${level} cleared (${score.overallAccuracyPercent}%). Difficulty increased — ${next.label}.`,
        );
      } else {
        setClearedMessage(
          `Expert level held — Perfect Pour Accuracy ${score.overallAccuracyPercent}%.`,
        );
      }
    } else {
      setClearedMessage(
        `Need ${PRACTICE_SUCCESS_THRESHOLD}%+ Perfect Pour Accuracy to advance (got ${score.overallAccuracyPercent}%). Try again on level ${level}.`,
      );
    }
    void submitPourScore({
      mode: "practice",
      score: score.overallAccuracyPercent,
      level,
      completedPours: 1,
      bestSingleAccuracy: score.overallAccuracyPercent,
    })
      .then((result) => {
        if (result.personalBestUpdated) {
          setClearedMessage((prev) =>
            [
              prev,
              result.publicBoardUpdated
                ? "Personal best saved to your profile and public pour scoreboard."
                : "Personal best saved to your profile.",
            ]
              .filter(Boolean)
              .join(" "),
          );
        } else {
          setClearedMessage((prev) =>
            [prev, "Run recorded — did not beat your personal best."]
              .filter(Boolean)
              .join(" "),
          );
        }
      })
      .catch(() => {
        setClearedMessage((prev) =>
          [prev, "Sign in to save scores to your profile."]
            .filter(Boolean)
            .join(" "),
        );
      });
  }, [level]);

  const {
    phase,
    state,
    config,
    lastScore,
    phaseHint,
    startPour,
    stopPour,
    reset,
  } = useTwoPartPour({ difficulty, onComplete });

  const display = displayLevels(state);
  const canPour = phase === "first_pour" || phase === "top_up";
  const targetBottom = config.targetLiquidLevel * 100;
  const targetTop =
    (config.targetLiquidLevel + config.targetHeadSize) * 100;

  function handleReset() {
    setClearedMessage(null);
    reset();
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <p className={styles.brand}>PintPal</p>
        <h1>Pour the Perfect Pint</h1>
        <p className={styles.sub}>
          Practice mode — bartender pour skill. No timer. Scored on Perfect Pour
          Accuracy, not drinking.
        </p>
        <p className={styles.levelBadge}>
          Level {difficulty.level} · {difficulty.label} · speed{" "}
          {difficulty.pourSpeed.toFixed(2)} · liquid ±
          {difficulty.liquidTolerance.toFixed(3)}
        </p>
      </header>

      <p className={styles.phase} data-phase={phase}>
        {phase === "first_pour" && "Phase 1 · First pour"}
        {phase === "settle" && "Phase 2 · Settle"}
        {phase === "top_up" && "Phase 3 · Top-up"}
        {phase === "complete" && "Round complete"}
      </p>
      <p className={styles.hint}>{phaseHint}</p>

      <div
        className={styles.glass}
        role="img"
        aria-label={`Liquid ${Math.round(display.liquidLevel * 100)}%, head ${Math.round(display.headSize * 100)}%`}
      >
        <div
          className={styles.targetBand}
          style={{
            bottom: `${targetBottom}%`,
            height: `${Math.max(targetTop - targetBottom, 2)}%`,
          }}
        />
        <div
          className={styles.liquid}
          style={{
            height: `${display.liquidLevel * 100}%`,
            background: config.liquidColor,
          }}
        />
        <div
          className={styles.head}
          style={{
            bottom: `${display.liquidLevel * 100}%`,
            height: `${display.headSize * 100}%`,
            background: config.headColor,
          }}
        />
        <div className={styles.rim} />
        {state.isOverflowed ? (
          <span className={styles.overflow}>Overflowed</span>
        ) : null}
      </div>

      <div className={styles.controls}>
        <button
          type="button"
          className={styles.pourButton}
          disabled={!canPour}
          onPointerDown={(e) => {
            e.currentTarget.setPointerCapture(e.pointerId);
            startPour();
          }}
          onPointerUp={stopPour}
          onPointerCancel={stopPour}
        >
          {!canPour
            ? phase === "settle"
              ? "Settling…"
              : "Pour finished"
            : state.isPouring
              ? "Pouring… release to stop"
              : "Hold to pour"}
        </button>
        <button type="button" className={styles.resetButton} onClick={handleReset}>
          Reset pour
        </button>
      </div>

      {lastScore ? (
        <div className={styles.score} aria-live="polite">
          <p className={styles.scoreLabel}>{lastScore.feedbackLabel}</p>
          <p className={styles.scoreDetail}>
            Liquid: {lastScore.liquidAccuracyPercent}% · Head:{" "}
            {lastScore.headAccuracyPercent}%
          </p>
          {clearedMessage ? (
            <p className={styles.gradeNote}>{clearedMessage}</p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
