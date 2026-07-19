/**
 * UserPermissions.kt
 *
 * Purpose: Central permission checks derived from Firestore "users" document flags.
 * Connects to: Firestore collection "users" fields canLogin, canViewAdmin, and role.
 *              Called by auth gates and feature UI before showing protected screens.
 * Notes: Role strings alone are not enough for UI gating; always prefer the boolean
 *        flags. Defaults are deny (false) when a field is missing.
 */
package com.jdscott.pintpal.utilities

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
)

object UserPermissions {
    /** Whether the account is allowed to sign in / remain signed in. */
    fun canLogin(flags: UserPermissionFlags?): Boolean = flags?.canLogin == true

    /** Whether the account may see admin-only UI and admin routes. */
    fun canViewAdmin(flags: UserPermissionFlags?): Boolean = flags?.canViewAdmin == true

    /** Convenience: signed-in user with canLogin, for normal product features. */
    fun canViewApp(flags: UserPermissionFlags?): Boolean = canLogin(flags)
}
