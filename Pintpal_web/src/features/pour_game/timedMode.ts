/**
 * timedMode.ts
 *
 * Purpose: Timed-mode constants, score aggregation, and rising difficulty heats.
 * Connects to: TimedPourScreen; mirrored by Android TimedPourScoring.
 * Notes: Each completed two-part pour advances a heat (harder pour). Phases stay
 *        first pour → settle → top-up within every pour.
 */

import type { PourScore } from "@/features/games_common/types";
import { getPracticeLevel, PRACTICE_LEVELS } from "./practiceDifficulty";
import type { PourPhaseTargets, PracticeDifficulty } from "./types";

export const TIMED_DURATIONS_SECONDS = [30, 60, 90, 120] as const;
export type TimedDurationSeconds = (typeof TIMED_DURATIONS_SECONDS)[number];

export interface TimedRunSummary {
  durationSeconds: TimedDurationSeconds;
  completedPours: number;
  /** Sum of overall Perfect Pour Accuracy percents across completed pours. */
  accuracySum: number;
  bestSingleAccuracy: number;
  pourScores: PourScore[];
  /** Heat / difficulty level used for the next pour (1-based). */
  nextHeat: number;
}

const EXTENDED_PHASES: PourPhaseTargets = {
  firstPourLiquid: 0.55,
  firstPourHead: 0.12,
  settledHead: 0.06,
  settleDurationSeconds: 2.5,
  finalLiquid: 0.72,
  finalHead: 0.18,
};

/**
 * Difficulty for the upcoming pour. Heat 1 = easiest; rises after each completed pour.
 */
export function timedDifficultyForHeat(heat: number): PracticeDifficulty {
  const clamped = Math.max(1, Math.floor(heat));
  if (clamped <= PRACTICE_LEVELS.length) {
    const base = getPracticeLevel(clamped);
    return {
      ...base,
      label: `Heat ${clamped} — ${base.label.replace(/^Practice — /, "")}`,
    };
  }
  const extra = clamped - PRACTICE_LEVELS.length;
  const top = PRACTICE_LEVELS[PRACTICE_LEVELS.length - 1]!;
  return {
    level: clamped,
    label: `Heat ${clamped} — extreme`,
    pourSpeed: Math.min(0.75, top.pourSpeed + extra * 0.05),
    liquidTolerance: Math.max(0.015, top.liquidTolerance - extra * 0.004),
    headTolerance: Math.max(0.012, top.headTolerance - extra * 0.003),
    phases: {
      ...EXTENDED_PHASES,
      settleDurationSeconds: Math.max(
        0.9,
        top.phases.settleDurationSeconds - extra * 0.1,
      ),
    },
  };
}

export function createEmptyTimedSummary(
  durationSeconds: TimedDurationSeconds,
): TimedRunSummary {
  return {
    durationSeconds,
    completedPours: 0,
    accuracySum: 0,
    bestSingleAccuracy: 0,
    pourScores: [],
    nextHeat: 1,
  };
}

/** Appends a completed pour; returns updated summary (immutable). */
export function recordTimedPour(
  summary: TimedRunSummary,
  score: PourScore,
): TimedRunSummary {
  const accuracy = score.overallAccuracyPercent;
  const completedPours = summary.completedPours + 1;
  return {
    ...summary,
    completedPours,
    accuracySum: Math.round((summary.accuracySum + accuracy) * 10) / 10,
    bestSingleAccuracy: Math.max(summary.bestSingleAccuracy, accuracy),
    pourScores: [...summary.pourScores, score],
    nextHeat: completedPours + 1,
  };
}
