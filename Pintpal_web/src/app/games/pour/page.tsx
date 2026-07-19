/**
 * page.tsx (pour practice)
 *
 * Purpose: Thin route for Pour the Perfect Pint practice mode.
 * Connects to: features/pour_game PracticePourScreen.
 * Notes: Stage 2 — no timer, no Firestore scoreboard yet.
 */

import { PracticePourScreen } from "@/features/pour_game/components/PracticePourScreen";

export default function PourPracticePage() {
  return <PracticePourScreen />;
}
