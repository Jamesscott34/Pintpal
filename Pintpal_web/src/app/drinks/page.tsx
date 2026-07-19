/**
 * page.tsx — /drinks
 *
 * Purpose: Beer / mix ratings with similar suggestions.
 */

import { AppShell } from "@/features/app_shell/components/AppShell";
import { DrinkRatingsScreen } from "@/features/drinks/components";

export default function DrinksPage() {
  return (
    <AppShell section="public">
      <DrinkRatingsScreen />
    </AppShell>
  );
}
