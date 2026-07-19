/**
 * practiceDifficulty.ts
 *
 * Purpose: Progressive practice difficulties for Pour the Perfect Pint.
 * Connects to: PracticePourScreen / useTwoPartPour; Android PracticeLevels.
 * Notes: Each successful level tightens tolerances and/or raises pour speed.
 *        Success = Perfect Pour Accuracy >= PRACTICE_SUCCESS_THRESHOLD (pour skill only).
 */

import type { PracticeDifficulty, PourPhaseTargets } from "./types";

/** Minimum overall Perfect Pour Accuracy to clear a practice level. */
export const PRACTICE_SUCCESS_THRESHOLD = 75;

const BASE_PHASES: PourPhaseTargets = {
  firstPourLiquid: 0.55,
  firstPourHead: 0.12,
  settledHead: 0.06,
  settleDurationSeconds: 2.5,
  finalLiquid: 0.72,
  finalHead: 0.18,
};

/** Levels 1–5: slower/wider → faster/tighter. */
export const PRACTICE_LEVELS: PracticeDifficulty[] = [
  {
    level: 1,
    label: "Practice — easy",
    pourSpeed: 0.22,
    liquidTolerance: 0.1,
    headTolerance: 0.08,
    phases: { ...BASE_PHASES, settleDurationSeconds: 2.5 },
  },
  {
    level: 2,
    label: "Practice — steady",
    pourSpeed: 0.28,
    liquidTolerance: 0.08,
    headTolerance: 0.065,
    phases: { ...BASE_PHASES, settleDurationSeconds: 2.2 },
  },
  {
    level: 3,
    label: "Practice — firm",
    pourSpeed: 0.34,
    liquidTolerance: 0.06,
    headTolerance: 0.05,
    phases: { ...BASE_PHASES, settleDurationSeconds: 2.0 },
  },
  {
    level: 4,
    label: "Practice — sharp",
    pourSpeed: 0.4,
    liquidTolerance: 0.045,
    headTolerance: 0.04,
    phases: { ...BASE_PHASES, settleDurationSeconds: 1.7 },
  },
  {
    level: 5,
    label: "Practice — expert",
    pourSpeed: 0.48,
    liquidTolerance: 0.03,
    headTolerance: 0.028,
    phases: { ...BASE_PHASES, settleDurationSeconds: 1.4 },
  },
];

export const PRACTICE_LEVEL_1 = PRACTICE_LEVELS[0];

export function getPracticeLevel(level: number): PracticeDifficulty {
  const found = PRACTICE_LEVELS.find((l) => l.level === level);
  return found ?? PRACTICE_LEVELS[PRACTICE_LEVELS.length - 1];
}

/** Next level after a success, or the same max level if already at the top. */
export function nextPracticeLevel(current: number): PracticeDifficulty {
  const idx = PRACTICE_LEVELS.findIndex((l) => l.level === current);
  if (idx < 0) return PRACTICE_LEVEL_1;
  return PRACTICE_LEVELS[Math.min(idx + 1, PRACTICE_LEVELS.length - 1)];
}

export function isPracticeSuccess(overallAccuracyPercent: number): boolean {
  return overallAccuracyPercent >= PRACTICE_SUCCESS_THRESHOLD;
}

/** True when level B is strictly harder than A (tighter and/or faster). */
export function isHarderThan(
  a: PracticeDifficulty,
  b: PracticeDifficulty,
): boolean {
  return (
    b.level > a.level &&
    (b.pourSpeed > a.pourSpeed ||
      b.liquidTolerance < a.liquidTolerance ||
      b.headTolerance < a.headTolerance)
  );
}
