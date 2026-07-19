/**
 * TiltPourGlass.tsx
 *
 * Purpose: Glass that fills when tilted (device orientation or drag).
 * Connects to: useDeviceTilt + usePourMechanic; tilt game + Serving Rush.
 */

"use client";

import { useEffect, useRef } from "react";
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
      pourSpeed:
        (config?.pourSpeed ?? 0.35) * (0.45 + tilt.tiltAmount * 1.35),
    },
    inputLocked,
    onScore,
  });
  const wasPouring = useRef(false);

  useEffect(() => {
    reset();
  }, [resetKey, reset]);

  // Tilt amount drives pour on/off and effective speed via start/stop.
  useEffect(() => {
    if (inputLocked) {
      if (wasPouring.current) {
        stopPour();
        wasPouring.current = false;
      }
      return;
    }
    const shouldPour = tilt.tiltAmount >= 0.18;
    if (shouldPour && !wasPouring.current) {
      startPour();
      wasPouring.current = true;
    } else if (!shouldPour && wasPouring.current) {
      stopPour();
      wasPouring.current = false;
    }
  }, [tilt.tiltAmount, inputLocked, startPour, stopPour]);

  const display = displayLevels(state);
  const liquidColor = resolved.liquidColor ?? "#1a1208";
  const headColor = resolved.headColor ?? "#f2ebe0";
  const targetBottom = resolved.targetLiquidLevel * 100;
  const targetTop =
    (resolved.targetLiquidLevel + resolved.targetHeadSize) * 100;

  return (
    <div className={styles.root}>
      <p className={styles.skillNote}>
        Tilt the glass to pour — bartender skill, not drinking. On desktop, drag
        on the glass; on phone, tip the device.
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
        style={{ transform: `rotate(${tilt.tiltDegrees}deg)` }}
        {...tilt.bindPointerTilt}
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
        Tilt: {Math.round(tilt.tiltAmount * 100)}%
        {tilt.source === "orientation"
          ? " · motion"
          : tilt.source === "pointer"
            ? " · drag"
            : ""}
        {state.isPouring ? " · pouring" : ""}
      </p>

      {lastScore ? (
        <p className={styles.score}>{lastScore.feedbackLabel}</p>
      ) : (
        <p className={styles.hint}>
          Tip until liquid rises, then level out to stop and score.
        </p>
      )}
    </div>
  );
}
