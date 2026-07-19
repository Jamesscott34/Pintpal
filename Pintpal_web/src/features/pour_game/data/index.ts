/**
 * data/index.ts
 *
 * Purpose: Public exports for pour_game data layer (Firestore scores).
 * Connects to: pourGameScoreRepository; Practice/Timed/Scoreboard screens.
 */

export {
  submitPourScore,
  setPourScoreboardOptIn,
  loadPublicPourScoreboard,
  loadPourProfile,
} from "./pourGameScoreRepository";
export type {
  PourScoreMode,
  PourScoreSubmission,
  PourScoreSubmitResult,
  PourScoreboardEntry,
} from "./pourGameScoreRepository";
