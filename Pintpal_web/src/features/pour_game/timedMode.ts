/**
 * timedMode.ts
 *
 * Purpose: Timed-mode constants and score aggregation for Pour the Perfect Pint.
 * Connects to: TimedPourScreen; mirrored by Android TimedPourScoring.
 * Notes: Player picks 30/60/90/120s. As many complete two-part pours as possible.
 *        Primary score = sum of Perfect Pour Accuracies. Incomplete pours do not count.
 */

import type { PourScore } from "@/features/games_common/types";

export const TIMED_DURATIONS_SECONDS = [30, 60, 90, 120] as const;
export type TimedDurationSeconds = (typeof TIMED_DURATIONS_SECONDS)[number];

export interface TimedRunSummary {
  durationSeconds: TimedDurationSeconds;
  completedPours: number;
  /** Sum of overall Perfect Pour Accuracy percents across completed pours. */
  accuracySum: number;
  bestSingleAccuracy: number;
  pourScores: PourScore[];
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
  };
}

/** Appends a completed pour; returns updated summary (immutable). */
export function recordTimedPour(
  summary: TimedRunSummary,
  score: PourScore,
): TimedRunSummary {
  const accuracy = score.overallAccuracyPercent;
  return {
    ...summary,
    completedPours: summary.completedPours + 1,
    accuracySum: Math.round((summary.accuracySum + accuracy) * 10) / 10,
    bestSingleAccuracy: Math.max(summary.bestSingleAccuracy, accuracy),
    pourScores: [...summary.pourScores, score],
  };
}
