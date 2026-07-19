/**
 * PourGameScoreModels.kt
 *
 * Purpose: Score submission / scoreboard models for Pour the Perfect Pint.
 * Connects to: PourGameScoreRepository; Firestore pour_game_scores + users profile fields.
 * Notes: Scores are Perfect Pour Accuracy (practice) or accuracy sum (timed) — never drinking.
 */
package com.jdscott.pintpal.features.pour_game.domain

enum class PourScoreMode {
    PRACTICE,
    TIMED,
}

data class PourScoreSubmission(
    val mode: PourScoreMode,
    /** Practice: overall accuracy %. Timed: sum of accuracies. */
    val score: Double,
    val durationSeconds: Int? = null,
    val level: Int? = null,
    val completedPours: Int = 1,
    val bestSingleAccuracy: Double? = null,
)

data class PourScoreboardEntry(
    val id: String,
    val userId: String,
    val displayName: String,
    val mode: PourScoreMode,
    val score: Double,
    val durationSeconds: Int?,
    val level: Int?,
    val completedPours: Int,
    val bestSingleAccuracy: Double?,
    val updatedAtMs: Long,
    val isPublic: Boolean,
)

data class PourScoreSubmitResult(
    val personalBestUpdated: Boolean,
    val publicBoardUpdated: Boolean,
    val profileBestPractice: Double?,
    val profileBestTimedForDuration: Double?,
)
