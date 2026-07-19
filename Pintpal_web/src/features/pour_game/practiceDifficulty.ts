/**
 * practiceDifficulty.ts
 *
 * Purpose: Easy starting difficulty for Pour the Perfect Pint practice mode.
 * Connects to: useTwoPartPour / PracticePourScreen.
 * Notes: Stage 2 uses level 1 only (wide tolerances, slow pour). Progression in Stage 3.
 */

import type { PracticeDifficulty } from "./types";

/** Stage 2 practice — generous windows so players can learn the mechanic. */
export const PRACTICE_LEVEL_1: PracticeDifficulty = {
  level: 1,
  label: "Practice — easy",
  pourSpeed: 0.22,
  liquidTolerance: 0.1,
  headTolerance: 0.08,
  phases: {
    firstPourLiquid: 0.55,
    firstPourHead: 0.12,
    settledHead: 0.06,
    settleDurationSeconds: 2.5,
    finalLiquid: 0.72,
    finalHead: 0.18,
  },
};
