/**
 * permissions.ts
 *
 * Purpose: Central permission checks from Firestore "users" document flags (web).
 * Connects to: Firestore collection "users" fields canLogin, canViewAdmin, role.
 *              Used by auth hooks and feature UI to hide gated routes/components.
 * Notes: Defaults are deny (false) when flags are missing. Prefer booleans over
 *        role string checks for UI gating.
 */

export type UserPermissionFlags = {
  canLogin?: boolean;
  canViewAdmin?: boolean;
  role?: string | null;
  email?: string | null;
  name?: string | null;
};

export function canLogin(flags: UserPermissionFlags | null | undefined): boolean {
  return flags?.canLogin === true;
}

export function canViewAdmin(flags: UserPermissionFlags | null | undefined): boolean {
  return flags?.canViewAdmin === true;
}

/** Signed-in user with canLogin, for normal product features. */
export function canViewApp(flags: UserPermissionFlags | null | undefined): boolean {
  return canLogin(flags);
}
