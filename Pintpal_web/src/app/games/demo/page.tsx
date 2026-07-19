/**
 * page.tsx (games mechanic demo)
 *
 * Purpose: Thin verification route for the shared pour mechanic.
 * Connects to: features/games_common PourMechanicDemo; AppShell Public section.
 */

import { AppShell } from "@/features/app_shell/components";
import { PourMechanicDemo } from "@/features/games_common/components/PourMechanicDemo";

export default function GamesMechanicDemoPage() {
  return (
    <AppShell section="public">
      <PourMechanicDemo />
    </AppShell>
  );
}
