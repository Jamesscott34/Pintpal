/**
 * useTwoPartPour.ts
 *
 * Purpose: Guinness-style two-part pour state machine on top of games_common advance/score.
 * Connects to: PracticePourScreen; advancePour, scorePour, settlePour.
 * Notes: Practice mode has no timer. Phases: first pour → settle → top-up → score.
 */

"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { advancePour } from "@/features/games_common/advancePour";
import { scorePour } from "@/features/games_common/scorePour";
import {
  EMPTY_POUR_STATE,
  type PourConfig,
  type PourScore,
  type PourState,
} from "@/features/games_common/types";
import { PRACTICE_LEVEL_1 } from "../practiceDifficulty";
import { advanceSettle } from "../settlePour";
import type { PourPhase, PracticeDifficulty } from "../types";

export interface UseTwoPartPourOptions {
  difficulty?: PracticeDifficulty;
  inputLocked?: boolean;
  onComplete?: (score: PourScore) => void;
}

export interface UseTwoPartPourResult {
  phase: PourPhase;
  state: PourState;
  config: PourConfig;
  lastScore: PourScore | null;
  phaseHint: string;
  startPour: () => void;
  stopPour: () => void;
  reset: () => void;
}

function buildConfig(
  difficulty: PracticeDifficulty,
  phase: PourPhase,
): PourConfig {
  const targets =
    phase === "top_up" || phase === "complete"
      ? {
          targetLiquidLevel: difficulty.phases.finalLiquid,
          targetHeadSize: difficulty.phases.finalHead,
        }
      : {
          targetLiquidLevel: difficulty.phases.firstPourLiquid,
          targetHeadSize: difficulty.phases.firstPourHead,
        };

  return {
    pourSpeed: difficulty.pourSpeed,
    headRatio: phase === "top_up" ? 0.35 : 0.2,
    liquidTolerance: difficulty.liquidTolerance,
    headTolerance: difficulty.headTolerance,
    failDistance: 0.4,
    inputMode: "press_and_hold",
    liquidColor: "#1a1208",
    headColor: "#f2ebe0",
    ...targets,
  };
}

const PHASE_HINTS: Record<PourPhase, string> = {
  first_pour:
    "First pour: hold to fill to about two-thirds, then release and let it settle.",
  settle: "Settling… head is dropping. Wait for the top-up.",
  top_up: "Top-up: hold to finish the pour — aim for the ideal head band.",
  complete: "Pour complete — check your Perfect Pour Accuracy.",
};

export function useTwoPartPour(
  options: UseTwoPartPourOptions = {},
): UseTwoPartPourResult {
  const difficulty = options.difficulty ?? PRACTICE_LEVEL_1;
  const inputLocked = options.inputLocked ?? false;
  const onCompleteRef = useRef(options.onComplete);
  onCompleteRef.current = options.onComplete;

  const [phase, setPhase] = useState<PourPhase>("first_pour");
  const [state, setState] = useState<PourState>(EMPTY_POUR_STATE);
  const [lastScore, setLastScore] = useState<PourScore | null>(null);

  const phaseRef = useRef(phase);
  phaseRef.current = phase;
  const stateRef = useRef(state);
  stateRef.current = state;
  const difficultyRef = useRef(difficulty);
  difficultyRef.current = difficulty;
  const pouringRef = useRef(false);
  const rafRef = useRef<number | null>(null);
  const lastTsRef = useRef<number | null>(null);

  const config = buildConfig(difficulty, phase);

  const stopLoop = useCallback(() => {
    if (rafRef.current != null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    lastTsRef.current = null;
  }, []);

  const finishRound = useCallback((finalState: PourState) => {
    pouringRef.current = false;
    stopLoop();
    const cfg = buildConfig(difficultyRef.current, "complete");
    const score = scorePour(finalState, cfg);
    setLastScore(score);
    setPhase("complete");
    setState({ ...finalState, isPouring: false });
    onCompleteRef.current?.(score);
  }, [stopLoop]);

  const tick = useCallback(
    (ts: number) => {
      const last = lastTsRef.current ?? ts;
      const dt = Math.min(0.05, (ts - last) / 1000);
      lastTsRef.current = ts;
      const currentPhase = phaseRef.current;
      const diff = difficultyRef.current;

      if (currentPhase === "settle") {
        setState((prev) => {
          const next = advanceSettle(
            prev,
            diff.phases.settledHead,
            diff.phases.settleDurationSeconds,
            dt,
          );
          const settled =
            Math.abs(next.headSize - diff.phases.settledHead) < 0.008;
          if (settled) {
            queueMicrotask(() => setPhase("top_up"));
          }
          return next;
        });
        rafRef.current = requestAnimationFrame(tick);
        return;
      }

      if (
        (currentPhase === "first_pour" || currentPhase === "top_up") &&
        pouringRef.current
      ) {
        const cfg = buildConfig(diff, currentPhase);
        setState((prev) => advancePour(prev, cfg, dt));
        rafRef.current = requestAnimationFrame(tick);
        return;
      }

      rafRef.current = null;
    },
    [],
  );

  const ensureLoop = useCallback(() => {
    if (rafRef.current == null) {
      lastTsRef.current = null;
      rafRef.current = requestAnimationFrame(tick);
    }
  }, [tick]);

  const startPour = useCallback(() => {
    if (inputLocked) return;
    const p = phaseRef.current;
    if (p !== "first_pour" && p !== "top_up") return;
    if (pouringRef.current) return;
    pouringRef.current = true;
    setState((prev) => ({ ...prev, isPouring: true }));
    ensureLoop();
  }, [ensureLoop, inputLocked]);

  const stopPour = useCallback(() => {
    if (!pouringRef.current) return;
    pouringRef.current = false;
    setState((prev) => {
      const stopped = { ...prev, isPouring: false };
      const p = phaseRef.current;
      if (p === "first_pour") {
        queueMicrotask(() => {
          setPhase("settle");
          ensureLoop();
        });
      } else if (p === "top_up") {
        queueMicrotask(() => finishRound(stopped));
      }
      return stopped;
    });
  }, [ensureLoop, finishRound]);

  const reset = useCallback(() => {
    pouringRef.current = false;
    stopLoop();
    setPhase("first_pour");
    setState(EMPTY_POUR_STATE);
    setLastScore(null);
  }, [stopLoop]);

  useEffect(() => {
    if (phase === "settle") {
      ensureLoop();
    }
  }, [phase, ensureLoop]);

  useEffect(() => () => stopLoop(), [stopLoop]);

  return {
    phase,
    state,
    config,
    lastScore,
    phaseHint: PHASE_HINTS[phase],
    startPour,
    stopPour,
    reset,
  };
}
