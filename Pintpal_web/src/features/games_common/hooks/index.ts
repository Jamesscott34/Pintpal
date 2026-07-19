/**
 * hooks/index.ts
 *
 * Purpose: Public exports for games_common hooks.
 * Connects to: PourGlass and any game UI that drives the shared pour mechanic.
 */

export { usePourMechanic } from "./usePourMechanic";
export type {
  UsePourMechanicOptions,
  UsePourMechanicResult,
} from "./usePourMechanic";
