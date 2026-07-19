/**
 * PourGlass.tsx
 *
 * Purpose: Reusable glass fill UI — liquid level + head/foam + pour controls.
 * Connects to: usePourMechanic; consumed later by pour_game and serving_game pages.
 * Notes: Stage 1 local mechanic only. UI copy reports pour accuracy, not drinking.
 */

"use client";

import { displayLevels } from "../advancePour";
import { usePourMechanic } from "../hooks/usePourMechanic";
import type { PourConfig, PourScore } from "../types";
import styles from "./PourGlass.module.css";

export interface PourGlassProps {
  config?: Partial<PourConfig>;
  inputLocked?: boolean;
  showControls?: boolean;
  onScore?: (score: PourScore) => void;
  className?: string;
}

export function PourGlass({
  config,
  inputLocked = false,
  showControls = true,
  onScore,
  className,
}: PourGlassProps) {
  const {
    state,
    config: resolved,
    lastScore,
    startPour,
    stopPour,
    togglePour,
    reset,
  } = usePourMechanic({ config, inputLocked, onScore });

  const display = displayLevels(state);
  const inputMode = resolved.inputMode ?? "press_and_hold";
  const liquidColor = resolved.liquidColor ?? "#1a1208";
  const headColor = resolved.headColor ?? "#f2ebe0";

  const targetBottom = resolved.targetLiquidLevel * 100;
  const targetTop =
    (resolved.targetLiquidLevel + resolved.targetHeadSize) * 100;

  return (
    <div className={[styles.root, className].filter(Boolean).join(" ")}>
      <p className={styles.skillNote}>
        Bartender skill challenge — scored on pour accuracy, not drinking.
      </p>

      <div
        className={styles.glass}
        role="img"
        aria-label={`Glass fill liquid ${Math.round(display.liquidLevel * 100)} percent, head ${Math.round(display.headSize * 100)} percent`}
      >
        <div
          className={styles.targetBand}
          style={{
            bottom: `${targetBottom}%`,
            height: `${Math.max(targetTop - targetBottom, 2)}%`,
          }}
          title="Ideal head band"
        />
        <div
          className={styles.liquid}
          style={{
            height: `${display.liquidLevel * 100}%`,
            background: liquidColor,
          }}
        />
        <div
          className={styles.head}
          style={{
            bottom: `${display.liquidLevel * 100}%`,
            height: `${display.headSize * 100}%`,
            background: headColor,
          }}
        />
        <div className={styles.rim} />
        {state.isOverflowed ? (
          <span className={styles.overflowBadge}>Rim overflow</span>
        ) : null}
      </div>

      {showControls ? (
        <div className={styles.controls}>
          {inputMode === "press_and_hold" ? (
            <button
              type="button"
              className={styles.pourButton}
              disabled={inputLocked}
              onPointerDown={(e) => {
                e.currentTarget.setPointerCapture(e.pointerId);
                startPour();
              }}
              onPointerUp={stopPour}
              onPointerCancel={stopPour}
              onPointerLeave={() => {
                if (state.isPouring) {
                  stopPour();
                }
              }}
            >
              {state.isPouring ? "Pouring… release to stop" : "Hold to pour"}
            </button>
          ) : (
            <button
              type="button"
              className={styles.pourButton}
              disabled={inputLocked}
              onClick={togglePour}
            >
              {state.isPouring ? "Tap to stop" : "Tap to pour"}
            </button>
          )}
          <button
            type="button"
            className={styles.resetButton}
            onClick={reset}
            disabled={inputLocked && state.isPouring}
          >
            Reset glass
          </button>
        </div>
      ) : null}

      {lastScore ? (
        <div className={styles.score} aria-live="polite">
          <p className={styles.scoreLabel}>{lastScore.feedbackLabel}</p>
          <p className={styles.scoreDetail}>
            Liquid accuracy: {lastScore.liquidAccuracyPercent}% · Head
            accuracy: {lastScore.headAccuracyPercent}%
          </p>
        </div>
      ) : (
        <p className={styles.hint}>
          Stop near the ideal band for a higher Perfect Pour Accuracy score.
        </p>
      )}
    </div>
  );
}
