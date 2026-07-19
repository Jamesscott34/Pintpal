/**
 * PracticePourScreen.tsx
 *
 * Purpose: Pour the Perfect Pint practice mode — Guinness-style two-part pour, no timer.
 * Connects to: useTwoPartPour; app/games/pour/page.tsx.
 * Notes: Easy tolerances. Copy is pour-skill only (Perfect Pour Accuracy).
 */

"use client";

import { displayLevels } from "@/features/games_common/advancePour";
import { useTwoPartPour } from "../hooks/useTwoPartPour";
import styles from "./PracticePourScreen.module.css";

export function PracticePourScreen() {
  const {
    phase,
    state,
    config,
    lastScore,
    phaseHint,
    startPour,
    stopPour,
    reset,
  } = useTwoPartPour();

  const display = displayLevels(state);
  const canPour = phase === "first_pour" || phase === "top_up";
  const targetBottom = config.targetLiquidLevel * 100;
  const targetTop =
    (config.targetLiquidLevel + config.targetHeadSize) * 100;

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <p className={styles.brand}>PintPal</p>
        <h1>Pour the Perfect Pint</h1>
        <p className={styles.sub}>
          Practice mode — bartender pour skill. No timer. Scored on Perfect Pour
          Accuracy, not drinking.
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
        <button type="button" className={styles.resetButton} onClick={reset}>
          Reset practice
        </button>
      </div>

      {lastScore ? (
        <div className={styles.score} aria-live="polite">
          <p className={styles.scoreLabel}>{lastScore.feedbackLabel}</p>
          <p className={styles.scoreDetail}>
            Liquid: {lastScore.liquidAccuracyPercent}% · Head:{" "}
            {lastScore.headAccuracyPercent}%
          </p>
          <p className={styles.gradeNote}>
            Try stopping early vs late on the top-up — grades like “too little
            head” and “overflowed” should differ clearly.
          </p>
        </div>
      ) : null}
    </div>
  );
}
