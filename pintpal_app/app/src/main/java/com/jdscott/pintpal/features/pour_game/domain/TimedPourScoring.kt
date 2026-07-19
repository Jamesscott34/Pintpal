/**
 * TimedPourScoring.kt
 *
 * Purpose: Aggregates timed-run Perfect Pour Accuracies + rising heat difficulty.
 * Connects to: PourTimedActivity; mirrored by web timedMode.ts.
 */
package com.jdscott.pintpal.features.pour_game.domain

import com.jdscott.pintpal.features.games_common.domain.PourScore
import kotlin.math.max
import kotlin.math.min

data class TimedRunSummary(
    val durationSeconds: Int,
    val completedPours: Int = 0,
    val accuracySum: Float = 0f,
    val bestSingleAccuracy: Float = 0f,
    val pourScores: List<PourScore> = emptyList(),
    /** Heat for the upcoming pour (1-based). */
    val nextHeat: Int = 1,
)

object TimedPourScoring {

    fun empty(durationSeconds: Int): TimedRunSummary =
        TimedRunSummary(durationSeconds = durationSeconds, nextHeat = 1)

    fun record(summary: TimedRunSummary, score: PourScore): TimedRunSummary {
        val accuracy = score.overallAccuracyPercent
        val completed = summary.completedPours + 1
        return summary.copy(
            completedPours = completed,
            accuracySum = ((summary.accuracySum + accuracy) * 10f).toInt() / 10f,
            bestSingleAccuracy = maxOf(summary.bestSingleAccuracy, accuracy),
            pourScores = summary.pourScores + score,
            nextHeat = completed + 1,
        )
    }

    /** Heat 1 = easiest; rises after each completed pour. */
    fun difficultyForHeat(heat: Int): PracticeDifficulty {
        val clamped = max(1, heat)
        if (clamped <= PracticeLevels.ALL.size) {
            val base = PracticeLevels.get(clamped)
            return base.copy(
                label = "Heat $clamped — ${base.label.removePrefix("Practice — ")}",
            )
        }
        val extra = clamped - PracticeLevels.ALL.size
        val top = PracticeLevels.ALL.last()
        return PracticeDifficulty(
            level = clamped,
            label = "Heat $clamped — extreme",
            pourSpeed = min(0.75f, top.pourSpeed + extra * 0.05f),
            liquidTolerance = max(0.015f, top.liquidTolerance - extra * 0.004f),
            headTolerance = max(0.012f, top.headTolerance - extra * 0.003f),
            phases = top.phases.copy(
                settleDurationSeconds = max(0.9f, top.phases.settleDurationSeconds - extra * 0.1f),
            ),
        )
    }
}
