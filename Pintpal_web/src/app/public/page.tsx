/**
 * page.tsx — /public
 *
 * Purpose: Public section entry (games & chats).
 * Connects to: AppShell + PublicHub. Requires canLogin === true.
 */

import { AppShell, PublicHub } from "@/features/app_shell/components";

export default function PublicPage() {
  return (
    <AppShell section="public">
      <PublicHub />
    </AppShell>
  );
}
