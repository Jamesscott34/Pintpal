/**
 * difficulty.ts
 *
 * Purpose: Progressive Serving Rush heats — start easy, get harder.
 * Connects to: ServingRushScreen (choices, timer, pour tunables).
 */

import type { PourConfig } from "@/features/games_common/types";
import { DEFAULT_POUR_CONFIG } from "@/features/games_common/types";
import {
  SERVING_DRINKS,
  drinkById,
  type ServingDrink,
  type ServingDrinkId,
} from "./drinks";

export type ServingHeat = {
  /** Display label for the heat. */
  label: string;
  /** Seconds allowed for this order (pick + pour). */
  seconds: number;
  /** How many pint-name buttons to show (includes the correct one). */
  choiceCount: number;
  /** Multiplier on drink pourSpeed (higher = harder to stop on target). */
  pourSpeedMul: number;
  /** Multiplier on scoring tolerances (higher = more forgiving). */
  toleranceMul: number;
};

/** 0-based order index → heat settings. */
export function heatForOrder(orderIndex: number): ServingHeat {
  if (orderIndex <= 1) {
    return {
      label: "Easy",
      seconds: 22,
      choiceCount: 2,
      pourSpeedMul: 0.72,
      toleranceMul: 1.55,
    };
  }
  if (orderIndex <= 3) {
    return {
      label: "Warming up",
      seconds: 16,
      choiceCount: 3,
      pourSpeedMul: 0.95,
      toleranceMul: 1.2,
    };
  }
  if (orderIndex <= 5) {
    return {
      label: "Busy",
      seconds: 12,
      choiceCount: 4,
      pourSpeedMul: 1.15,
      toleranceMul: 1,
    };
  }
  return {
    label: "Rush hour",
    seconds: 9,
    choiceCount: 4,
    pourSpeedMul: 1.4,
    toleranceMul: 0.72,
  };
}

function shuffle<T>(items: T[]): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j]!, out[i]!];
  }
  return out;
}

/** Pint names shown for this order — always includes the correct drink. */
export function choicesForOrder(
  correct: ServingDrinkId,
  orderIndex: number,
): ServingDrinkId[] {
  const count = Math.min(
    heatForOrder(orderIndex).choiceCount,
    SERVING_DRINKS.length,
  );
  const others = shuffle(
    SERVING_DRINKS.map((d) => d.id).filter((id) => id !== correct),
  ).slice(0, count - 1);
  return shuffle([correct, ...others]);
}

/** Pour config scaled for the current heat. */
export function pourConfigForHeat(
  drink: ServingDrink,
  orderIndex: number,
): Partial<PourConfig> {
  const heat = heatForOrder(orderIndex);
  const base = { ...DEFAULT_POUR_CONFIG, ...drink.pourConfig };
  return {
    ...drink.pourConfig,
    pourSpeed: base.pourSpeed * heat.pourSpeedMul,
    liquidTolerance: base.liquidTolerance * heat.toleranceMul,
    headTolerance: base.headTolerance * heat.toleranceMul,
  };
}

export function drinkAndHeat(orderIndex: number, drinkId: ServingDrinkId) {
  return {
    drink: drinkById(drinkId),
    heat: heatForOrder(orderIndex),
    pourConfig: pourConfigForHeat(drinkById(drinkId), orderIndex),
  };
}
