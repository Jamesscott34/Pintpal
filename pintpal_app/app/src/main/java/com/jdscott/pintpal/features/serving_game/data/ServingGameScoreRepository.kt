/**
 * ServingGameScoreRepository.kt
 *
 * Purpose: Persist Serving Rush personal bests + public serving_game_scores.
 */
package com.jdscott.pintpal.features.serving_game.data

import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.firestore.FirebaseFirestore
import com.google.firebase.firestore.SetOptions
import com.jdscott.pintpal.features.pour_game.domain.PersonalBest
import com.jdscott.pintpal.utilities.FirebaseConstants
import kotlinx.coroutines.tasks.await

data class ServingSubmitResult(
    val personalBestUpdated: Boolean,
    val publicBoardUpdated: Boolean,
)

class ServingGameScoreRepository(
    private val auth: FirebaseAuth = FirebaseAuth.getInstance(),
    private val firestore: FirebaseFirestore = FirebaseFirestore.getInstance(),
) {
    suspend fun submitScore(
        score: Int,
        completedOrders: Int,
        misses: Int,
    ): Result<ServingSubmitResult> = runCatching {
        val user = auth.currentUser ?: error("Not signed in")
        val userRef = firestore.collection(FirebaseConstants.Collections.USERS).document(user.uid)
        val snap = userRef.get().await()
        val data = snap.data.orEmpty()
        val previous = (data[FirebaseConstants.UserFields.SERVING_GAME_BEST] as? Number)?.toDouble()
        val personalBestUpdated = PersonalBest.isImproved(previous, score.toDouble())
        if (personalBestUpdated) {
            userRef.set(
                mapOf(FirebaseConstants.UserFields.SERVING_GAME_BEST to score),
                SetOptions.merge(),
            ).await()
        }
        val optIn =
            data[FirebaseConstants.UserFields.SERVING_GAME_SCOREBOARD_OPT_IN] as? Boolean ?: false
        var publicBoardUpdated = false
        if (optIn && personalBestUpdated) {
            val name = (data[FirebaseConstants.UserFields.NAME] as? String)?.trim()
                .orEmpty()
                .ifBlank { user.email.orEmpty().ifBlank { "Player" } }
            firestore.collection(FirebaseConstants.Collections.SERVING_GAME_SCORES)
                .document("${user.uid}_best")
                .set(
                    mapOf(
                        FirebaseConstants.ServingGameScoreFields.USER_ID to user.uid,
                        FirebaseConstants.ServingGameScoreFields.DISPLAY_NAME to name,
                        FirebaseConstants.ServingGameScoreFields.SCORE to score,
                        FirebaseConstants.ServingGameScoreFields.COMPLETED_ORDERS to completedOrders,
                        FirebaseConstants.ServingGameScoreFields.MISSES to misses,
                        FirebaseConstants.ServingGameScoreFields.UPDATED_AT to System.currentTimeMillis(),
                        FirebaseConstants.ServingGameScoreFields.IS_PUBLIC to true,
                    ),
                    SetOptions.merge(),
                )
                .await()
            publicBoardUpdated = true
        }
        ServingSubmitResult(personalBestUpdated, publicBoardUpdated)
    }

    suspend fun setScoreboardOptIn(optIn: Boolean): Result<Unit> = runCatching {
        val user = auth.currentUser ?: error("Not signed in")
        val userRef = firestore.collection(FirebaseConstants.Collections.USERS).document(user.uid)
        userRef.set(
            mapOf(FirebaseConstants.UserFields.SERVING_GAME_SCOREBOARD_OPT_IN to optIn),
            SetOptions.merge(),
        ).await()
        if (!optIn) {
            firestore.collection(FirebaseConstants.Collections.SERVING_GAME_SCORES)
                .document("${user.uid}_best")
                .delete()
                .await()
        }
    }

    suspend fun isScoreboardOptIn(): Boolean {
        val user = auth.currentUser ?: return false
        val snap = firestore.collection(FirebaseConstants.Collections.USERS)
            .document(user.uid)
            .get()
            .await()
        return snap.getBoolean(FirebaseConstants.UserFields.SERVING_GAME_SCOREBOARD_OPT_IN) == true
    }
}
