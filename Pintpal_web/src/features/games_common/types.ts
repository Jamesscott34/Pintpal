/**
 * types.ts
 *
 * Purpose: Shared types for the bartender pour mechanic used by both mini-games.
 * Connects to: games_common components/hooks; pour_game and serving_game feature UIs.
 * Notes: Levels are normalized 0–1 (fraction of glass). Copy must describe pour skill
 *        (accuracy / head size), never drinking speed or volume consumed. No Firestore.
 */

/** How the player starts and stops the pour. */
export type PourInputMode = "press_and_hold" | "tap_to_toggle";

/**
 * Tunables passed into the shared pour view by each game / difficulty level.
 * All level values are fractions of glass height (0 = empty, 1 = rim).
 */
export interface PourConfig {
  /** Glass fill rate in fraction-of-glass per second while pouring. */
  pourSpeed: number;
  /** Portion of each poured unit that becomes head/foam (0–1). Rest is liquid. */
  headRatio: number;
  /** Ideal liquid level (body below the head). */
  targetLiquidLevel: number;
  /** Ideal head/foam thickness as a fraction of glass height. */
  targetHeadSize: number;
  /** Half-width of the "perfect" liquid window around the target. */
  liquidTolerance: number;
  /** Half-width of the "perfect" head window around the target. */
  headTolerance: number;
  /**
   * Distance past the perfect window at which accuracy hits 0%.
   * Defaults applied in the scorer when omitted.
   */
  failDistance?: number;
  inputMode?: PourInputMode;
  /** CSS / canvas liquid colour (stout, lager, cider, etc.). */
  liquidColor?: string;
  /** CSS / canvas head/foam colour. */
  headColor?: string;
}

/** Live pour state inside the glass (normalized). */
export interface PourState {
  liquidLevel: number;
  headSize: number;
  isPouring: boolean;
  /** True once liquid + head has exceeded the rim (1.0). */
  isOverflowed: boolean;
}

/** Skill feedback labels — pour accuracy only, never drinking volume/speed. */
export type PourFeedback =
  | "perfect_pour"
  | "good_pour"
  | "too_little_liquid"
  | "too_much_liquid"
  | "too_little_head"
  | "too_much_head"
  | "overflowed"
  | "underfilled";

export interface PourScore {
  liquidLevel: number;
  headSize: number;
  liquidAccuracyPercent: number;
  headAccuracyPercent: number;
  /** Weighted blend of liquid + head accuracy (pour skill). */
  overallAccuracyPercent: number;
  feedback: PourFeedback;
  /** UI-safe sentence, e.g. "Perfect Pour Accuracy: 94%". */
  feedbackLabel: string;
}

export const DEFAULT_POUR_CONFIG: PourConfig = {
  pourSpeed: 0.35,
  headRatio: 0.22,
  targetLiquidLevel: 0.72,
  targetHeadSize: 0.18,
  liquidTolerance: 0.06,
  headTolerance: 0.05,
  failDistance: 0.35,
  inputMode: "press_and_hold",
  liquidColor: "#1a1208",
  headColor: "#f2ebe0",
};

export const EMPTY_POUR_STATE: PourState = {
  liquidLevel: 0,
  headSize: 0,
  isPouring: false,
  isOverflowed: false,
};
