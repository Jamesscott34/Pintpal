/**
 * PourGameScoreRepository.kt
 *
 * Purpose: Persists pour-game personal bests on users/{uid} and public pour_game_scores.
 * Connects to: Firestore Collections.USERS + POUR_GAME_SCORES; PourPractice/Timed activities.
 * Notes: Worse runs never overwrite a better personal best. Public board only when opt-in.
 *        Separate from ratings/contribution leaderboards.
 */
package com.jdscott.pintpal.features.pour_game.data

import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.firestore.FirebaseFirestore
import com.google.firebase.firestore.Query
import com.google.firebase.firestore.SetOptions
import com.jdscott.pintpal.features.auth.domain.UserDocument
import com.jdscott.pintpal.features.pour_game.domain.PersonalBest
import com.jdscott.pintpal.features.pour_game.domain.PourScoreMode
import com.jdscott.pintpal.features.pour_game.domain.PourScoreSubmitResult
import com.jdscott.pintpal.features.pour_game.domain.PourScoreSubmission
import com.jdscott.pintpal.features.pour_game.domain.PourScoreboardEntry
import com.jdscott.pintpal.utilities.FirebaseConstants
import kotlinx.coroutines.tasks.await

class PourGameScoreRepository(
    private val auth: FirebaseAuth = FirebaseAuth.getInstance(),
    private val firestore: FirebaseFirestore = FirebaseFirestore.getInstance(),
) {
    suspend fun loadCurrentUser(): UserDocument? {
        val user = auth.currentUser ?: return null
        val snap = firestore.collection(FirebaseConstants.Collections.USERS)
            .document(user.uid)
            .get()
            .await()
        if (!snap.exists()) return null
        return UserDocument.fromFirestore(user.uid, snap.data ?: emptyMap())
    }

    suspend fun setScoreboardOptIn(optIn: Boolean): Result<Unit> {
        val user = auth.currentUser ?: return Result.failure(IllegalStateException("Not signed in"))
        return runCatching {
            firestore.collection(FirebaseConstants.Collections.USERS)
                .document(user.uid)
                .set(
                    mapOf(FirebaseConstants.UserFields.POUR_GAME_SCOREBOARD_OPT_IN to optIn),
                    SetOptions.merge(),
                )
                .await()
            if (!optIn) {
                // Hide any existing public entries for this user.
                val existing = firestore.collection(FirebaseConstants.Collections.POUR_GAME_SCORES)
                    .whereEqualTo(FirebaseConstants.PourGameScoreFields.USER_ID, user.uid)
                    .get()
                    .await()
                for (doc in existing.documents) {
                    doc.reference.set(
                        mapOf(FirebaseConstants.PourGameScoreFields.IS_PUBLIC to false),
                        SetOptions.merge(),
                    ).await()
                }
            }
        }
    }

    /**
     * Updates profile personal best if improved; updates public board only when opt-in
     * and the new score is a personal best (or equal — still refresh display name).
     */
    suspend fun submitScore(submission: PourScoreSubmission): Result<PourScoreSubmitResult> {
        val user = auth.currentUser
            ?: return Result.failure(IllegalStateException("Not signed in"))
        return runCatching {
            val userRef = firestore.collection(FirebaseConstants.Collections.USERS).document(user.uid)
            val snap = userRef.get().await()
            val doc = UserDocument.fromFirestore(user.uid, snap.data ?: emptyMap())

            val personalBestUpdated: Boolean
            val profileBestPractice: Double?
            val profileBestTimed: Double?
            val profileUpdates = mutableMapOf<String, Any>()

            when (submission.mode) {
                PourScoreMode.PRACTICE -> {
                    val previous = doc.pourGameBestPracticeAccuracy
                    personalBestUpdated = PersonalBest.isImproved(previous, submission.score)
                    if (personalBestUpdated) {
                        profileUpdates[FirebaseConstants.UserFields.POUR_GAME_BEST_PRACTICE] =
                            submission.score
                    }
                    profileBestPractice =
                        if (personalBestUpdated) submission.score else previous
                    profileBestTimed = null
                }
                PourScoreMode.TIMED -> {
                    val key = (submission.durationSeconds ?: 0).toString()
                    val previous = doc.pourGameBestTimedAccuracySums[key]
                    personalBestUpdated = PersonalBest.isImproved(previous, submission.score)
                    if (personalBestUpdated) {
                        val nextMap = doc.pourGameBestTimedAccuracySums.toMutableMap()
                        nextMap[key] = submission.score
                        profileUpdates[FirebaseConstants.UserFields.POUR_GAME_BEST_TIMED] = nextMap
                    }
                    profileBestPractice = null
                    profileBestTimed =
                        if (personalBestUpdated) submission.score else previous
                }
            }

            if (profileUpdates.isNotEmpty()) {
                userRef.set(profileUpdates, SetOptions.merge()).await()
            }

            var publicBoardUpdated = false
            if (doc.pourGameScoreboardOptIn && personalBestUpdated) {
                val boardId = boardDocumentId(user.uid, submission)
                val payload = mutableMapOf<String, Any>(
                    FirebaseConstants.PourGameScoreFields.USER_ID to user.uid,
                    FirebaseConstants.PourGameScoreFields.DISPLAY_NAME to
                        doc.name.ifBlank { user.email ?: "Player" },
                    FirebaseConstants.PourGameScoreFields.MODE to submission.mode.name.lowercase(),
                    FirebaseConstants.PourGameScoreFields.SCORE to submission.score,
                    FirebaseConstants.PourGameScoreFields.COMPLETED_POURS to submission.completedPours,
                    FirebaseConstants.PourGameScoreFields.UPDATED_AT to System.currentTimeMillis(),
                    FirebaseConstants.PourGameScoreFields.IS_PUBLIC to true,
                )
                submission.durationSeconds?.let {
                    payload[FirebaseConstants.PourGameScoreFields.DURATION_SECONDS] = it
                }
                submission.level?.let {
                    payload[FirebaseConstants.PourGameScoreFields.LEVEL] = it
                }
                submission.bestSingleAccuracy?.let {
                    payload[FirebaseConstants.PourGameScoreFields.BEST_SINGLE_ACCURACY] = it
                }
                firestore.collection(FirebaseConstants.Collections.POUR_GAME_SCORES)
                    .document(boardId)
                    .set(payload, SetOptions.merge())
                    .await()
                publicBoardUpdated = true
            }

            PourScoreSubmitResult(
                personalBestUpdated = personalBestUpdated,
                publicBoardUpdated = publicBoardUpdated,
                profileBestPractice = profileBestPractice
                    ?: doc.pourGameBestPracticeAccuracy,
                profileBestTimedForDuration = profileBestTimed,
            )
        }
    }

    suspend fun loadPublicScoreboard(
        mode: PourScoreMode,
        durationSeconds: Int? = null,
        limit: Long = 50,
    ): Result<List<PourScoreboardEntry>> = runCatching {
        var query = firestore.collection(FirebaseConstants.Collections.POUR_GAME_SCORES)
            .whereEqualTo(FirebaseConstants.PourGameScoreFields.IS_PUBLIC, true)
            .whereEqualTo(
                FirebaseConstants.PourGameScoreFields.MODE,
                mode.name.lowercase(),
            )
        if (mode == PourScoreMode.TIMED && durationSeconds != null) {
            query = query.whereEqualTo(
                FirebaseConstants.PourGameScoreFields.DURATION_SECONDS,
                durationSeconds,
            )
        }
        val snap = query
            .orderBy(FirebaseConstants.PourGameScoreFields.SCORE, Query.Direction.DESCENDING)
            .limit(limit)
            .get()
            .await()
        snap.documents.map { d ->
            val data = d.data ?: emptyMap()
            PourScoreboardEntry(
                id = d.id,
                userId = data[FirebaseConstants.PourGameScoreFields.USER_ID] as? String ?: "",
                displayName =
                    data[FirebaseConstants.PourGameScoreFields.DISPLAY_NAME] as? String ?: "Player",
                mode = mode,
                score = (data[FirebaseConstants.PourGameScoreFields.SCORE] as? Number)?.toDouble()
                    ?: 0.0,
                durationSeconds =
                    (data[FirebaseConstants.PourGameScoreFields.DURATION_SECONDS] as? Number)?.toInt(),
                level = (data[FirebaseConstants.PourGameScoreFields.LEVEL] as? Number)?.toInt(),
                completedPours =
                    (data[FirebaseConstants.PourGameScoreFields.COMPLETED_POURS] as? Number)?.toInt()
                        ?: 0,
                bestSingleAccuracy =
                    (data[FirebaseConstants.PourGameScoreFields.BEST_SINGLE_ACCURACY] as? Number)
                        ?.toDouble(),
                updatedAtMs =
                    (data[FirebaseConstants.PourGameScoreFields.UPDATED_AT] as? Number)?.toLong()
                        ?: 0L,
                isPublic = data[FirebaseConstants.PourGameScoreFields.IS_PUBLIC] as? Boolean ?: false,
            )
        }
    }

    private fun boardDocumentId(uid: String, submission: PourScoreSubmission): String =
        when (submission.mode) {
            PourScoreMode.PRACTICE -> "${uid}_practice"
            PourScoreMode.TIMED -> "${uid}_timed_${submission.durationSeconds ?: 0}"
        }
}
