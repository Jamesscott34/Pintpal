/**
 * page.tsx — /ratings
 *
 * Purpose: Best Pints photo contest — upload, rate 1–10, daily & weekly winners.
 */

import { AppShell } from "@/features/app_shell/components/AppShell";
import { BestPintsScreen } from "@/features/ratings/components";

export default function RatingsPage() {
  return (
    <AppShell section="public">
      <BestPintsScreen />
    </AppShell>
  );
}
