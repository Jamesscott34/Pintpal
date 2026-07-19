/**
 * page.tsx — /private
 *
 * Purpose: Private section — user profile / account only.
 * Connects to: AppShell + AccountPanel.
 */

import { AppShell } from "@/features/app_shell/components";
import { AccountPanel } from "@/features/auth/components";

export default function PrivatePage() {
  return (
    <AppShell section="private">
      <AccountPanel embedded />
    </AppShell>
  );
}
