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
    }

    object UserFields {
        const val EMAIL = "email"
        const val NAME = "name"
        const val ROLE = "role"
        const val CAN_LOGIN = "canLogin"
        const val CAN_VIEW_ADMIN = "canViewAdmin"
    }
}
