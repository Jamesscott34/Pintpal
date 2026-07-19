/**
 * drinks.ts
 *
 * Purpose: Serving Rush tap/drink catalogue (bartender skill — not drinking volume).
 * Connects to: ServingRushScreen; uses games_common PourConfig colours/targets.
 */

import type { PourConfig } from "@/features/games_common/types";

export type ServingDrinkId = "guinness" | "bulmers" | "lager" | "cider";

export type ServingDrink = {
  id: ServingDrinkId;
  label: string;
  pourConfig: Partial<PourConfig>;
};

export const SERVING_DRINKS: ServingDrink[] = [
  {
    id: "guinness",
    label: "Guinness",
    pourConfig: {
      liquidColor: "#1a1208",
      headColor: "#f2ebe0",
      headRatio: 0.24,
      targetLiquidLevel: 0.7,
      targetHeadSize: 0.2,
      pourSpeed: 0.32,
    },
  },
  {
    id: "bulmers",
    label: "Bulmers",
    pourConfig: {
      liquidColor: "#c45a1a",
      headColor: "#f7e7c8",
      headRatio: 0.12,
      targetLiquidLevel: 0.82,
      targetHeadSize: 0.1,
      pourSpeed: 0.4,
    },
  },
  {
    id: "lager",
    label: "Lager",
    pourConfig: {
      liquidColor: "#d4a017",
      headColor: "#fff6e0",
      headRatio: 0.16,
      targetLiquidLevel: 0.78,
      targetHeadSize: 0.14,
      pourSpeed: 0.38,
    },
  },
  {
    id: "cider",
    label: "Cider",
    pourConfig: {
      liquidColor: "#e8b84a",
      headColor: "#fff8e8",
      headRatio: 0.1,
      targetLiquidLevel: 0.84,
      targetHeadSize: 0.08,
      pourSpeed: 0.42,
    },
  },
];

export const SERVING_ORDER_SECONDS = 14;
export const SERVING_ORDERS_PER_RUN = 8;
export const SERVING_MISS_PENALTY = 10;

export function drinkById(id: ServingDrinkId): ServingDrink {
  const found = SERVING_DRINKS.find((d) => d.id === id);
  if (!found) throw new Error(`Unknown drink: ${id}`);
  return found;
}

export function randomDrinkId(exclude?: ServingDrinkId): ServingDrinkId {
  const pool = SERVING_DRINKS.map((d) => d.id).filter((id) => id !== exclude);
  return pool[Math.floor(Math.random() * pool.length)]!;
}
