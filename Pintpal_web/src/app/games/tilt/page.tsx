/**
 * page.tsx — /games/tilt
 *
 * Purpose: Tilt the Pint route inside Public AppShell.
 */

import { AppShell } from "@/features/app_shell/components";
import { TiltPourScreen } from "@/features/tilt_game/components";

export default function TiltGamePage() {
  return (
    <AppShell section="public">
      <TiltPourScreen />
    </AppShell>
  );
}
