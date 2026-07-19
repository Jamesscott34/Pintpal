/**
 * types.ts
 *
 * Purpose: Pour the Perfect Pint feature types (practice / timed modes).
 * Connects to: pour_game components and hooks; uses games_common PourConfig/PourScore.
 * Notes: Bartender pour skill only — never drinking speed or volume consumed.
 */

import type { PourConfig, PourScore } from "@/features/games_common/types";

/** Guinness-style two-part pour phases. */
export type PourPhase = "first_pour" | "settle" | "top_up" | "complete";

export type PourGameMode = "practice" | "timed";

export interface PourPhaseTargets {
  /** Target liquid at end of first pour (before settle). */
  firstPourLiquid: number;
  firstPourHead: number;
  /** After settle, head shrinks toward this; liquid may rise slightly. */
  settledHead: number;
  settleDurationSeconds: number;
  /** Final ideal after top-up (passed into games_common scorer). */
  finalLiquid: number;
  finalHead: number;
}

export interface PracticeDifficulty {
  level: number;
  label: string;
  pourSpeed: number;
  liquidTolerance: number;
  headTolerance: number;
  phases: PourPhaseTargets;
}

export interface PourGameRoundResult {
  mode: PourGameMode;
  level: number;
  score: PourScore;
  phaseScores?: {
    firstPour?: PourScore;
  };
}

/** Allowed timed-run lengths (seconds). */
export type TimedDurationOption = 30 | 60 | 90 | 120;

export type { PourConfig, PourScore };
