/**
 * UserDocument.kt
 *
 * Purpose: Domain model for a Firestore users/{uid} document shared with the web client.
 * Connects to: Firestore collection "users". Used by AuthRepository, PourGameScoreRepository.
 * Notes: forNewRegistration sets role="user", canLogin=true, canViewAdmin=false only.
 *        Pour-game profile fields store personal bests only (never drinking metrics).
 */
package com.jdscott.pintpal.features.auth.domain

import com.jdscott.pintpal.utilities.FirebaseConstants
import com.jdscott.pintpal.utilities.UserPermissionFlags

data class UserDocument(
    val uid: String,
    val email: String,
    val name: String,
    val role: String = DEFAULT_ROLE,
    val canLogin: Boolean = true,
    val canViewAdmin: Boolean = false,
    /** Best practice Perfect Pour Accuracy (0–100). Null if never played. */
    val pourGameBestPracticeAccuracy: Double? = null,
    /** Duration seconds → best timed accuracy sum. */
    val pourGameBestTimedAccuracySums: Map<String, Double> = emptyMap(),
    /** Opt-in to appear on the public pour scoreboard. */
    val pourGameScoreboardOptIn: Boolean = false,
) {
    fun toFirestoreMap(): Map<String, Any> {
        val map = mutableMapOf<String, Any>(
            FirebaseConstants.UserFields.EMAIL to email,
            FirebaseConstants.UserFields.NAME to name,
            FirebaseConstants.UserFields.ROLE to role,
            FirebaseConstants.UserFields.CAN_LOGIN to canLogin,
            FirebaseConstants.UserFields.CAN_VIEW_ADMIN to canViewAdmin,
            FirebaseConstants.UserFields.POUR_GAME_SCOREBOARD_OPT_IN to pourGameScoreboardOptIn,
            FirebaseConstants.UserFields.POUR_GAME_BEST_TIMED to pourGameBestTimedAccuracySums,
        )
        pourGameBestPracticeAccuracy?.let {
            map[FirebaseConstants.UserFields.POUR_GAME_BEST_PRACTICE] = it
        }
        return map
    }

    fun toPermissionFlags(): UserPermissionFlags = UserPermissionFlags(
        canLogin = canLogin,
        canViewAdmin = canViewAdmin,
        role = role,
        email = email,
        name = name,
    )

    companion object {
        const val DEFAULT_ROLE = "user"

        fun forNewRegistration(uid: String, email: String, name: String): UserDocument {
            return UserDocument(
                uid = uid,
                email = email,
                name = name,
                role = DEFAULT_ROLE,
                canLogin = true,
                canViewAdmin = false,
            )
        }

        fun fromFirestore(uid: String, data: Map<String, Any?>): UserDocument {
            @Suppress("UNCHECKED_CAST")
            val timedRaw = data[FirebaseConstants.UserFields.POUR_GAME_BEST_TIMED] as? Map<String, Any?>
            val timed = timedRaw?.mapNotNull { (k, v) ->
                val num = (v as? Number)?.toDouble() ?: return@mapNotNull null
                k to num
            }?.toMap() ?: emptyMap()
            val practice = (data[FirebaseConstants.UserFields.POUR_GAME_BEST_PRACTICE] as? Number)
                ?.toDouble()
            return UserDocument(
                uid = uid,
                email = data[FirebaseConstants.UserFields.EMAIL] as? String ?: "",
                name = data[FirebaseConstants.UserFields.NAME] as? String ?: "",
                role = data[FirebaseConstants.UserFields.ROLE] as? String ?: DEFAULT_ROLE,
                canLogin = data[FirebaseConstants.UserFields.CAN_LOGIN] as? Boolean ?: false,
                canViewAdmin = data[FirebaseConstants.UserFields.CAN_VIEW_ADMIN] as? Boolean ?: false,
                pourGameBestPracticeAccuracy = practice,
                pourGameBestTimedAccuracySums = timed,
                pourGameScoreboardOptIn =
                    data[FirebaseConstants.UserFields.POUR_GAME_SCOREBOARD_OPT_IN] as? Boolean ?: false,
            )
        }
    }
}
