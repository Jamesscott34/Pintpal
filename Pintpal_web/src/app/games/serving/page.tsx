/**
 * page.tsx — /games/serving
 *
 * Purpose: Serving Rush route inside Public AppShell.
 */

import { AppShell } from "@/features/app_shell/components";
import { ServingGameHub } from "@/features/serving_game/components";

export default function ServingGamePage() {
  return (
    <AppShell section="public">
      <ServingGameHub />
    </AppShell>
  );
}
