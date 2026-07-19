/**
 * settlePour.ts
 *
 * Purpose: Pure settle step — head shrinks toward settled target during the settle phase.
 * Connects to: useTwoPartPour; mirrored by Android PourSettleSimulator.
 * Notes: Converts excess head into a clearer liquid line (bartender settle), not drinking.
 */

import type { PourState } from "@/features/games_common/types";

/**
 * Advances settle: head approaches settledHead; surplus head converts into liquid.
 * Deterministic for fixed dt.
 */
export function advanceSettle(
  state: PourState,
  settledHead: number,
  settleDurationSeconds: number,
  dtSeconds: number,
): PourState {
  if (dtSeconds <= 0 || settleDurationSeconds <= 0) {
    return state;
  }
  const rate = 1 / settleDurationSeconds;
  const headDiff = state.headSize - settledHead;
  if (Math.abs(headDiff) < 0.001) {
    return {
      ...state,
      headSize: settledHead,
      isPouring: false,
    };
  }
  const step = headDiff * Math.min(1, rate * dtSeconds * 2.5);
  const newHead = state.headSize - step;
  const converted = state.headSize - newHead;
  return {
    ...state,
    headSize: Math.max(settledHead, newHead),
    liquidLevel: state.liquidLevel + converted * 0.85,
    isPouring: false,
  };
}
