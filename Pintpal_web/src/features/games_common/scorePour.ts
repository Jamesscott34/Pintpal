/**
 * scorePour.ts
 *
 * Purpose: Deterministic accuracy scorer for the shared pour mechanic.
 * Connects to: usePourMechanic / PourGlass; mirrored by Android PourAccuracyScorer.
 * Notes: Pure function — same inputs always yield the same score. Grades pour skill
 *        (liquid level + head size vs targets), never drinking speed or volume drunk.
 */

import type { PourConfig, PourFeedback, PourScore, PourState } from "./types";

const DEFAULT_FAIL_DISTANCE = 0.35;
const LIQUID_WEIGHT = 0.55;
const HEAD_WEIGHT = 0.45;

function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value));
}

/**
 * Maps absolute error to 0–100 accuracy.
 * Within tolerance → 100. At tolerance + failDistance → 0. Linear in between.
 */
export function dimensionAccuracy(
  actual: number,
  target: number,
  tolerance: number,
  failDistance: number,
): number {
  const error = Math.abs(actual - target);
  if (error <= tolerance) {
    return 100;
  }
  const over = error - tolerance;
  const distance = failDistance > 0 ? failDistance : DEFAULT_FAIL_DISTANCE;
  return clamp01(1 - over / distance) * 100;
}

function round1(value: number): number {
  return Math.round(value * 10) / 10;
}

function pickFeedback(
  state: PourState,
  config: PourConfig,
  liquidAccuracy: number,
  headAccuracy: number,
): PourFeedback {
  const total = state.liquidLevel + state.headSize;
  if (state.isOverflowed || total > 1.0001) {
    return "overflowed";
  }
  if (total < 0.15) {
    return "underfilled";
  }

  const liquidError = state.liquidLevel - config.targetLiquidLevel;
  const headError = state.headSize - config.targetHeadSize;
  const liquidOk = Math.abs(liquidError) <= config.liquidTolerance;
  const headOk = Math.abs(headError) <= config.headTolerance;

  if (liquidOk && headOk) {
    return "perfect_pour";
  }

  if (liquidAccuracy >= 80 && headAccuracy >= 80) {
    return "good_pour";
  }

  // Prefer the worse dimension for the primary message.
  if (liquidAccuracy <= headAccuracy) {
    return liquidError < 0 ? "too_little_liquid" : "too_much_liquid";
  }
  return headError < 0 ? "too_little_head" : "too_much_head";
}

const FEEDBACK_LABELS: Record<PourFeedback, string> = {
  perfect_pour: "Perfect pour",
  good_pour: "Good pour",
  too_little_liquid: "Too little liquid",
  too_much_liquid: "Too much liquid",
  too_little_head: "Too little head",
  too_much_head: "Too much head",
  overflowed: "Overflowed",
  underfilled: "Underfilled",
};

/**
 * Scores a finished (or snapshot) pour against the configured targets.
 * Repeated calls with the same state + config always return the same result.
 */
export function scorePour(state: PourState, config: PourConfig): PourScore {
  const failDistance = config.failDistance ?? DEFAULT_FAIL_DISTANCE;
  const liquidAccuracyPercent = dimensionAccuracy(
    state.liquidLevel,
    config.targetLiquidLevel,
    config.liquidTolerance,
    failDistance,
  );
  const headAccuracyPercent = dimensionAccuracy(
    state.headSize,
    config.targetHeadSize,
    config.headTolerance,
    failDistance,
  );
  const overallAccuracyPercent = round1(
    liquidAccuracyPercent * LIQUID_WEIGHT + headAccuracyPercent * HEAD_WEIGHT,
  );
  const feedback = pickFeedback(
    state,
    config,
    liquidAccuracyPercent,
    headAccuracyPercent,
  );
  const feedbackLabel = `${FEEDBACK_LABELS[feedback]} — Perfect Pour Accuracy: ${overallAccuracyPercent}%`;

  return {
    liquidLevel: state.liquidLevel,
    headSize: state.headSize,
    liquidAccuracyPercent: round1(liquidAccuracyPercent),
    headAccuracyPercent: round1(headAccuracyPercent),
    overallAccuracyPercent,
    feedback,
    feedbackLabel,
  };
}
