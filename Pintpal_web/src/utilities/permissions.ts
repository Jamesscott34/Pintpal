/**
 * permissions.ts
 *
 * Purpose: Central permission checks from Firestore "users" document flags (web).
 * Connects to: Firestore collection "users" fields canLogin, canViewAdmin, role,
 *              subscriptionPaid, photoUploadsToday / photoUploadDate.
 * Notes: Defaults are deny (false) when flags are missing. Prefer booleans over
 *        role string checks for UI gating.
 *        Subscription: true == paid, false == free. Admins are always paid.
 *        Free tier: FREE_PHOTO_DAILY_LIMIT photos per calendar day; paid = unlimited.
 */

import { FREE_PHOTO_DAILY_LIMIT } from "@/utilities/firebaseConstants";

export type UserPermissionFlags = {
  canLogin?: boolean;
  canViewAdmin?: boolean;
  role?: string | null;
  email?: string | null;
  name?: string | null;
  /** Stored flag: true == paid, false == free. Admins override to paid. */
  subscriptionPaid?: boolean;
  photoUploadsToday?: number;
  photoUploadDate?: string | null;
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

function todayUtcDateString(): string {
  return new Date().toISOString().slice(0, 10);
}

/**
 * Effective paid status after sign-in.
 * Admin (canViewAdmin or role admin) is always paid; otherwise use subscriptionPaid.
 */
export function isSubscriptionPaid(
  flags: UserPermissionFlags | null | undefined,
): boolean {
  if (!flags) return false;
  if (canViewAdmin(flags)) return true;
  if ((flags.role ?? "").toLowerCase() === "admin") return true;
  return flags.subscriptionPaid === true;
}

/** Uploads already counted for today (resets when photoUploadDate != today). */
export function photoUploadsUsedToday(
  flags: UserPermissionFlags | null | undefined,
): number {
  if (!flags) return 0;
  if (flags.photoUploadDate !== todayUtcDateString()) return 0;
  const n = flags.photoUploadsToday;
  return typeof n === "number" && n > 0 ? n : 0;
}

/**
 * Whether the user may upload another photo now.
 * Paid / admin: always. Free: under FREE_PHOTO_DAILY_LIMIT for today.
 */
export function canUploadPhoto(
  flags: UserPermissionFlags | null | undefined,
): boolean {
  if (!canLogin(flags)) return false;
  if (isSubscriptionPaid(flags)) return true;
  return photoUploadsUsedToday(flags) < FREE_PHOTO_DAILY_LIMIT;
}

/** Remaining free-tier slots today; Infinity when paid. */
export function remainingPhotoUploadsToday(
  flags: UserPermissionFlags | null | undefined,
): number {
  if (isSubscriptionPaid(flags)) return Number.POSITIVE_INFINITY;
  return Math.max(0, FREE_PHOTO_DAILY_LIMIT - photoUploadsUsedToday(flags));
}

export function subscriptionLabel(
  flags: UserPermissionFlags | null | undefined,
): "paid" | "free" {
  return isSubscriptionPaid(flags) ? "paid" : "free";
}
