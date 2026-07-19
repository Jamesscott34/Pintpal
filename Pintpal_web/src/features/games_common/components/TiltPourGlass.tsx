/**
 * TiltPourGlass.tsx
 *
 * Purpose: Set glass tilt, save the angle, then tap to pour at that speed.
 * Connects to: useDeviceTilt + usePourMechanic; tilt game + Serving Rush.
 */

"use client";

import { useEffect, useMemo, useState } from "react";
import { displayLevels } from "../advancePour";
import { useDeviceTilt } from "../hooks/useDeviceTilt";
import { usePourMechanic } from "../hooks/usePourMechanic";
import type { PourConfig, PourScore } from "../types";
import styles from "./TiltPourGlass.module.css";

export type TiltPourGlassProps = {
  config?: Partial<PourConfig>;
  inputLocked?: boolean;
  onScore?: (score: PourScore) => void;
  /** Remount key from parent when starting a new pour. */
  resetKey?: number;
};

export function TiltPourGlass({
  config,
  inputLocked = false,
  onScore,
  resetKey = 0,
}: TiltPourGlassProps) {
  const tilt = useDeviceTilt();
  const [savedTilt, setSavedTilt] = useState<number | null>(null);
  const displayTilt = savedTilt ?? tilt.tiltAmount;
  const baseSpeed = config?.pourSpeed ?? 0.35;
  const pourSpeed = useMemo(
    () => baseSpeed * (0.45 + (savedTilt ?? 0) * 1.35),
    [baseSpeed, savedTilt],
  );

  const {
    state,
    config: resolved,
    lastScore,
    startPour,
    stopPour,
    reset,
  } = usePourMechanic({
    config: {
      ...config,
      pourSpeed,
    },
    inputLocked,
    onScore,
  });

  useEffect(() => {
    reset();
    setSavedTilt(null);
    tilt.resetTilt();
    // Only reset when the parent starts a new pour round.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- resetKey is the intentional trigger
  }, [resetKey]);

  const display = displayLevels(state);
  const liquidColor = resolved.liquidColor ?? "#1a1208";
  const headColor = resolved.headColor ?? "#f2ebe0";
  const targetBottom = resolved.targetLiquidLevel * 100;
  const targetTop =
    (resolved.targetLiquidLevel + resolved.targetHeadSize) * 100;
  const visualDegrees = -(displayTilt * 42);
  const canSave = !inputLocked && !state.isPouring && tilt.tiltAmount >= 0.08;
  const canPour =
    !inputLocked && savedTilt != null && savedTilt >= 0.08 && !lastScore;

  return (
    <div className={styles.root}>
      <p className={styles.skillNote}>
        Tilt the glass to an angle, save it, then tap Pour. Bartender skill —
        not drinking. On desktop, drag on the glass; on phone, tip the device.
      </p>

      {tilt.permission === "unknown" || tilt.permission === "denied" ? (
        <button
          type="button"
          className={styles.permBtn}
          onClick={() => void tilt.requestPermission()}
        >
          Enable motion tilt (optional)
        </button>
      ) : null}

      <div
        className={styles.stage}
        style={{ transform: `rotate(${visualDegrees}deg)` }}
        {...(savedTilt == null && !state.isPouring ? tilt.bindPointerTilt : {})}
      >
        <div
          className={styles.glass}
          role="img"
          aria-label={`Tilt pour liquid ${Math.round(display.liquidLevel * 100)} percent`}
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
        </div>
      </div>

      <p className={styles.meter} aria-live="polite">
        Live tilt: {Math.round(tilt.tiltAmount * 100)}%
        {savedTilt != null
          ? ` · Saved: ${Math.round(savedTilt * 100)}%`
          : ""}
        {tilt.source === "orientation"
          ? " · motion"
          : tilt.source === "pointer"
            ? " · drag"
            : ""}
        {state.isPouring ? " · pouring" : ""}
      </p>

      <div className={styles.actions}>
        <button
          type="button"
          className={styles.actionBtn}
          disabled={!canSave}
          onClick={() => setSavedTilt(tilt.tiltAmount)}
        >
          Save tilt
        </button>
        <button
          type="button"
          className={styles.actionBtn}
          disabled={inputLocked || savedTilt == null || state.isPouring}
          onClick={() => {
            setSavedTilt(null);
            tilt.resetTilt();
          }}
        >
          Clear tilt
        </button>
        {!state.isPouring ? (
          <button
            type="button"
            className={styles.actionBtnPrimary}
            disabled={!canPour}
            onClick={() => startPour()}
          >
            Tap to pour
          </button>
        ) : (
          <button
            type="button"
            className={styles.actionBtnPrimary}
            disabled={inputLocked}
            onClick={() => stopPour()}
          >
            Stop &amp; score
          </button>
        )}
      </div>

      {lastScore ? (
        <p className={styles.score}>{lastScore.feedbackLabel}</p>
      ) : (
        <p className={styles.hint}>
          1) Tilt to an angle · 2) Save tilt · 3) Tap to pour · 4) Stop near the
          ideal band
        </p>
      )}
    </div>
  );
}
