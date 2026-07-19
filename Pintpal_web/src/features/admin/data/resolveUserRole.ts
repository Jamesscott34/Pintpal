/**
 * resolveUserRole.ts
 *
 * Purpose: Derive a display role from a Firestore users profile for the admin list.
 * Notes: Admins often keep role="user" with canViewAdmin=true — treat that as admin.
 */

export function resolveDisplayRole(data: Record<string, unknown>): string {
  const rawRole =
    (typeof data.role === "string" && data.role) ||
    (typeof data.Role === "string" && data.Role) ||
    "";
  const normalized = rawRole.trim().toLowerCase();
  const canViewAdmin =
    data.canViewAdmin === true || data.CanViewAdmin === true;
  if (
    canViewAdmin ||
    normalized === "admin" ||
    normalized === "super_admin" ||
    normalized === "superadmin"
  ) {
    return normalized === "super_admin" || normalized === "superadmin"
      ? "admin"
      : "admin";
  }
  return rawRole.trim() || "user";
}

export function resolveCanViewAdmin(data: Record<string, unknown>): boolean {
  return (
    data.canViewAdmin === true ||
    data.CanViewAdmin === true ||
    resolveDisplayRole(data) === "admin"
  );
}
