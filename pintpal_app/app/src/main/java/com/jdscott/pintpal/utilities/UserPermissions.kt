/**
 * UserPermissions.kt
 *
 * Purpose: Central permission checks derived from Firestore "users" document flags.
 * Connects to: Firestore collection "users" fields canLogin, canViewAdmin, role,
 *              subscriptionPaid, photoUploadsToday / photoUploadDate.
 * Notes: Role strings alone are not enough for UI gating; always prefer the boolean
 *        flags. Defaults are deny (false) when a field is missing.
 *        Subscription: true == paid, false == free. Admins are always paid.
 *        Free tier: FREE_PHOTO_DAILY_LIMIT photos per calendar day; paid = unlimited.
 */
package com.jdscott.pintpal.utilities

import java.time.LocalDate
import java.time.ZoneOffset

/**
 * Snapshot of permission-related fields on a users/{uid} document.
 * Mirrors the live Firestore shape used by both Android and web clients.
 */
data class UserPermissionFlags(
    val canLogin: Boolean = false,
    val canViewAdmin: Boolean = false,
    val role: String? = null,
    val email: String? = null,
    val name: String? = null,
    /** Stored flag: true == paid, false == free. Admins override to paid. */
    val subscriptionPaid: Boolean = false,
    val photoUploadsToday: Int = 0,
    val photoUploadDate: String? = null,
)

object UserPermissions {
    /** Whether the account is allowed to sign in / remain signed in. */
    fun canLogin(flags: UserPermissionFlags?): Boolean = flags?.canLogin == true

    /** Whether the account may see admin-only UI and admin routes. */
    fun canViewAdmin(flags: UserPermissionFlags?): Boolean = flags?.canViewAdmin == true

    /** Convenience: signed-in user with canLogin, for normal product features. */
    fun canViewApp(flags: UserPermissionFlags?): Boolean = canLogin(flags)

    fun todayUtcDateString(): String =
        LocalDate.now(ZoneOffset.UTC).toString()

    /**
     * Effective paid status after sign-in.
     * Admin (canViewAdmin or role admin) is always paid; otherwise use subscriptionPaid.
     */
    fun isSubscriptionPaid(flags: UserPermissionFlags?): Boolean {
        if (flags == null) return false
        if (canViewAdmin(flags)) return true
        if (flags.role.equals("admin", ignoreCase = true)) return true
        return flags.subscriptionPaid
    }

    fun photoUploadsUsedToday(flags: UserPermissionFlags?): Int {
        if (flags == null) return 0
        if (flags.photoUploadDate != todayUtcDateString()) return 0
        return flags.photoUploadsToday.coerceAtLeast(0)
    }

    /** Paid / admin: always. Free: under FREE_PHOTO_DAILY_LIMIT for today. */
    fun canUploadPhoto(flags: UserPermissionFlags?): Boolean {
        if (!canLogin(flags)) return false
        if (isSubscriptionPaid(flags)) return true
        return photoUploadsUsedToday(flags) < FirebaseConstants.FREE_PHOTO_DAILY_LIMIT
    }

    /** Remaining free-tier slots today; Int.MAX_VALUE when paid. */
    fun remainingPhotoUploadsToday(flags: UserPermissionFlags?): Int {
        if (isSubscriptionPaid(flags)) return Int.MAX_VALUE
        return (FirebaseConstants.FREE_PHOTO_DAILY_LIMIT - photoUploadsUsedToday(flags))
            .coerceAtLeast(0)
    }

    fun subscriptionLabel(flags: UserPermissionFlags?): String =
        if (isSubscriptionPaid(flags)) "paid" else "free"
}
