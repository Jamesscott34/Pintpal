/**
 * page.tsx (account)
 *
 * Purpose: Thin App Router page for the signed-in account panel.
 * Connects to: features/auth/components/AccountPanel.
 * Notes: Client-side gate redirects to /login when unauthenticated.
 */

import { AccountPanel } from "@/features/auth/components/AccountPanel";

export default function AccountPage() {
  return <AccountPanel />;
}
