/**
 * page.tsx (pour)
 *
 * Purpose: Thin route for Pour the Perfect Pint hub (practice + timed).
 * Connects to: features/pour_game PourGameHub; AppShell Public section.
 */

import { AppShell } from "@/features/app_shell/components";
import { PourGameHub } from "@/features/pour_game/components/PourGameHub";

export default function PourGamePage() {
  return (
    <AppShell section="public">
      <PourGameHub />
    </AppShell>
  );
}
