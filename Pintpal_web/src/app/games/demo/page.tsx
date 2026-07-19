/**
 * page.tsx (games mechanic demo)
 *
 * Purpose: Thin Stage 1 verification route for the shared pour mechanic.
 * Connects to: features/games_common PourGlass. No Firestore.
 * Notes: Confirms fill animation + deterministic accuracy scoring in-browser.
 */

import { PourMechanicDemo } from "@/features/games_common/components/PourMechanicDemo";

export default function GamesMechanicDemoPage() {
  return <PourMechanicDemo />;
}
