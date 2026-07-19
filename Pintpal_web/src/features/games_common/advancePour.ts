/**
 * advancePour.ts
 *
 * Purpose: Pure step function that advances liquid + head while pouring.
 * Connects to: usePourMechanic (rAF loop); mirrored by Android PourSimulator.
 * Notes: No networking. Deterministic for a fixed dt so tests can replay pours.
 */

import type { PourConfig, PourState } from "./types";

/**
 * Advances pour state by dt seconds while isPouring is true.
 * Head and liquid rise together according to headRatio; overflow is flagged
 * when their sum exceeds the rim (1.0).
 */
export function advancePour(
  state: PourState,
  config: PourConfig,
  dtSeconds: number,
): PourState {
  if (!state.isPouring || dtSeconds <= 0) {
    return state;
  }

  const poured = config.pourSpeed * dtSeconds;
  const headRatio = Math.min(1, Math.max(0, config.headRatio));
  let liquidLevel = state.liquidLevel + poured * (1 - headRatio);
  let headSize = state.headSize + poured * headRatio;
  const total = liquidLevel + headSize;
  const isOverflowed = state.isOverflowed || total > 1;

  // Keep tracking past the rim so overflow scoring stays honest; display clamps separately.
  if (total > 1.5) {
    const scale = 1.5 / total;
    liquidLevel *= scale;
    headSize *= scale;
  }

  return {
    ...state,
    liquidLevel,
    headSize,
    isOverflowed,
  };
}

/** Display-clamped levels for drawing the glass (never draw above the rim). */
export function displayLevels(state: PourState): {
  liquidLevel: number;
  headSize: number;
} {
  const total = state.liquidLevel + state.headSize;
  if (total <= 1) {
    return { liquidLevel: state.liquidLevel, headSize: state.headSize };
  }
  const scale = 1 / total;
  return {
    liquidLevel: state.liquidLevel * scale,
    headSize: state.headSize * scale,
  };
}
