/**
 * usePourMechanic.ts
 *
 * Purpose: React hook wrapping fill animation, press/tap input, and accuracy scoring.
 * Connects to: PourGlass component; scorePour + advancePour pure modules.
 * Notes: Local-only Stage 1 mechanic — no Firestore. requestAnimationFrame drives fill.
 */

"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { advancePour } from "../advancePour";
import { scorePour } from "../scorePour";
import {
  DEFAULT_POUR_CONFIG,
  EMPTY_POUR_STATE,
  type PourConfig,
  type PourScore,
  type PourState,
} from "../types";

export interface UsePourMechanicOptions {
  config?: Partial<PourConfig>;
  /** When true, pour input is ignored (timed mode expiry, etc.). */
  inputLocked?: boolean;
  onScore?: (score: PourScore) => void;
}

export interface UsePourMechanicResult {
  state: PourState;
  config: PourConfig;
  lastScore: PourScore | null;
  startPour: () => void;
  stopPour: () => void;
  togglePour: () => void;
  reset: () => void;
  scoreNow: () => PourScore;
}

export function usePourMechanic(
  options: UsePourMechanicOptions = {},
): UsePourMechanicResult {
  const config: PourConfig = { ...DEFAULT_POUR_CONFIG, ...options.config };
  const inputLocked = options.inputLocked ?? false;
  const onScoreRef = useRef(options.onScore);
  onScoreRef.current = options.onScore;

  const [state, setState] = useState<PourState>(EMPTY_POUR_STATE);
  const [lastScore, setLastScore] = useState<PourScore | null>(null);
  const stateRef = useRef(state);
  stateRef.current = state;
  const configRef = useRef(config);
  configRef.current = config;
  const pouringRef = useRef(false);
  const rafRef = useRef<number | null>(null);
  const lastTsRef = useRef<number | null>(null);

  const stopLoop = useCallback(() => {
    if (rafRef.current != null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    lastTsRef.current = null;
  }, []);

  const tick = useCallback((ts: number) => {
    if (!pouringRef.current) {
      return;
    }
    const last = lastTsRef.current ?? ts;
    const dt = Math.min(0.05, (ts - last) / 1000);
    lastTsRef.current = ts;
    setState((prev) => advancePour(prev, configRef.current, dt));
    rafRef.current = requestAnimationFrame(tick);
  }, []);

  const startPour = useCallback(() => {
    if (inputLocked || pouringRef.current) {
      return;
    }
    pouringRef.current = true;
    setState((prev) => ({ ...prev, isPouring: true }));
    lastTsRef.current = null;
    rafRef.current = requestAnimationFrame(tick);
  }, [inputLocked, tick]);

  const stopPour = useCallback(() => {
    if (!pouringRef.current) {
      return;
    }
    pouringRef.current = false;
    stopLoop();
    setState((prev) => {
      const stopped = { ...prev, isPouring: false };
      const score = scorePour(stopped, configRef.current);
      setLastScore(score);
      onScoreRef.current?.(score);
      return stopped;
    });
  }, [stopLoop]);

  const togglePour = useCallback(() => {
    if (pouringRef.current) {
      stopPour();
    } else {
      startPour();
    }
  }, [startPour, stopPour]);

  const reset = useCallback(() => {
    pouringRef.current = false;
    stopLoop();
    setState(EMPTY_POUR_STATE);
    setLastScore(null);
  }, [stopLoop]);

  const scoreNow = useCallback(() => {
    const score = scorePour(stateRef.current, configRef.current);
    setLastScore(score);
    return score;
  }, []);

  useEffect(() => {
    if (inputLocked && pouringRef.current) {
      stopPour();
    }
  }, [inputLocked, stopPour]);

  useEffect(() => () => stopLoop(), [stopLoop]);

  return {
    state,
    config,
    lastScore,
    startPour,
    stopPour,
    togglePour,
    reset,
    scoreNow,
  };
}
