/**
 * page.tsx — /admin
 *
 * Purpose: Admin dashboard route (all users + community shortcuts).
 * Connects to: AppShell + AdminDashboard. Requires canViewAdmin.
 */

import { AppShell } from "@/features/app_shell/components";
import { AdminDashboard } from "@/features/admin/components";

export default function AdminPage() {
  return (
    <AppShell section="admin">
      <AdminDashboard />
    </AppShell>
  );
}
