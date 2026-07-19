/**
 * TimedPourScoring.kt
 *
 * Purpose: Aggregates timed-run Perfect Pour Accuracies (sum = primary score).
 * Connects to: PourTimedActivity; mirrored by web timedMode.ts.
 * Notes: Incomplete pours when the clock hits zero do not count.
 */
package com.jdscott.pintpal.features.pour_game.domain

import com.jdscott.pintpal.features.games_common.domain.PourScore

data class TimedRunSummary(
    val durationSeconds: Int,
    val completedPours: Int = 0,
    val accuracySum: Float = 0f,
    val bestSingleAccuracy: Float = 0f,
    val pourScores: List<PourScore> = emptyList(),
)

object TimedPourScoring {

    fun empty(durationSeconds: Int): TimedRunSummary =
        TimedRunSummary(durationSeconds = durationSeconds)

    fun record(summary: TimedRunSummary, score: PourScore): TimedRunSummary {
        val accuracy = score.overallAccuracyPercent
        return summary.copy(
            completedPours = summary.completedPours + 1,
            accuracySum = ((summary.accuracySum + accuracy) * 10f).toInt() / 10f,
            bestSingleAccuracy = maxOf(summary.bestSingleAccuracy, accuracy),
            pourScores = summary.pourScores + score,
        )
    }
}
