/**
 * FirebaseConstants.kt
 *
 * Purpose: Shared Firebase / Firestore collection and field name constants.
 * Connects to: Firebase project pintpal-71452. Used by feature data layers.
 * Notes: Do not invent new collection names here without confirming against the
 *        product spec. Stage 0 only documents the known "users" collection shape.
 */
package com.jdscott.pintpal.utilities

object FirebaseConstants {
    const val PROJECT_ID = "pintpal-71452"

    object Collections {
        const val USERS = "users"
        /** Pour the Perfect Pint scores only — never mixed with ratings/contribution boards. */
        const val POUR_GAME_SCORES = "pour_game_scores"
    }

    object UserFields {
        const val EMAIL = "email"
        const val NAME = "name"
        const val ROLE = "role"
        const val CAN_LOGIN = "canLogin"
        const val CAN_VIEW_ADMIN = "canViewAdmin"
        /** Profile: best practice Perfect Pour Accuracy (0–100). */
        const val POUR_GAME_BEST_PRACTICE = "pourGameBestPracticeAccuracy"
        /** Profile: map of durationSeconds → best timed accuracy sum. */
        const val POUR_GAME_BEST_TIMED = "pourGameBestTimedAccuracySums"
        /** Opt-in for public pour scoreboard. */
        const val POUR_GAME_SCOREBOARD_OPT_IN = "pourGameScoreboardOptIn"
    }

    object PourGameScoreFields {
        const val USER_ID = "userId"
        const val DISPLAY_NAME = "displayName"
        const val MODE = "mode"
        const val SCORE = "score"
        const val DURATION_SECONDS = "durationSeconds"
        const val LEVEL = "level"
        const val COMPLETED_POURS = "completedPours"
        const val BEST_SINGLE_ACCURACY = "bestSingleAccuracy"
        const val UPDATED_AT = "updatedAt"
        const val IS_PUBLIC = "isPublic"
    }
}
