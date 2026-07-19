/**
 * page.tsx — /ratings
 *
 * Purpose: Public beer ratings entry (placeholder until ratings feature lands).
 */

import { AppShell } from "@/features/app_shell/components";
import { RatingsComingSoon } from "@/features/ratings/components/RatingsComingSoon";

export default function RatingsPage() {
  return (
    <AppShell section="public">
      <RatingsComingSoon />
    </AppShell>
  );
}
