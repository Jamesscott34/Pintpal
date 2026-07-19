/**
 * PourAccuracyScorer.kt
 *
 * Purpose: Deterministic accuracy scorer for liquid level + head size vs targets.
 * Connects to: PourGlassView / game ViewModels; mirrored by web scorePour.ts.
 * Notes: Pure logic — same inputs always yield the same score. No drinking metrics.
 */
package com.jdscott.pintpal.features.games_common.domain

object PourAccuracyScorer {

    private const val LIQUID_WEIGHT = 0.55f
    private const val HEAD_WEIGHT = 0.45f

    fun dimensionAccuracy(
        actual: Float,
        target: Float,
        tolerance: Float,
        failDistance: Float,
    ): Float {
        val error = kotlin.math.abs(actual - target)
        if (error <= tolerance) {
            return 100f
        }
        val over = error - tolerance
        val distance = if (failDistance > 0f) failDistance else 0.35f
        return ((1f - over / distance).coerceIn(0f, 1f)) * 100f
    }

    fun score(state: PourState, config: PourConfig): PourScore {
        val liquidAccuracy = dimensionAccuracy(
            state.liquidLevel,
            config.targetLiquidLevel,
            config.liquidTolerance,
            config.failDistance,
        )
        val headAccuracy = dimensionAccuracy(
            state.headSize,
            config.targetHeadSize,
            config.headTolerance,
            config.failDistance,
        )
        val overall = round1(liquidAccuracy * LIQUID_WEIGHT + headAccuracy * HEAD_WEIGHT)
        val feedback = pickFeedback(state, config, liquidAccuracy, headAccuracy)
        val feedbackLabel =
            "${feedbackLabel(feedback)} — Perfect Pour Accuracy: $overall%"

        return PourScore(
            liquidLevel = state.liquidLevel,
            headSize = state.headSize,
            liquidAccuracyPercent = round1(liquidAccuracy),
            headAccuracyPercent = round1(headAccuracy),
            overallAccuracyPercent = overall,
            feedback = feedback,
            feedbackLabel = feedbackLabel,
        )
    }

    private fun pickFeedback(
        state: PourState,
        config: PourConfig,
        liquidAccuracy: Float,
        headAccuracy: Float,
    ): PourFeedback {
        val total = state.liquidLevel + state.headSize
        if (state.isOverflowed || total > 1.0001f) {
            return PourFeedback.OVERFLOWED
        }
        if (total < 0.15f) {
            return PourFeedback.UNDERFILLED
        }

        val liquidError = state.liquidLevel - config.targetLiquidLevel
        val headError = state.headSize - config.targetHeadSize
        val liquidOk = kotlin.math.abs(liquidError) <= config.liquidTolerance
        val headOk = kotlin.math.abs(headError) <= config.headTolerance

        if (liquidOk && headOk) {
            return PourFeedback.PERFECT_POUR
        }
        if (liquidAccuracy >= 80f && headAccuracy >= 80f) {
            return PourFeedback.GOOD_POUR
        }
        if (liquidAccuracy <= headAccuracy) {
            return if (liquidError < 0f) {
                PourFeedback.TOO_LITTLE_LIQUID
            } else {
                PourFeedback.TOO_MUCH_LIQUID
            }
        }
        return if (headError < 0f) {
            PourFeedback.TOO_LITTLE_HEAD
        } else {
            PourFeedback.TOO_MUCH_HEAD
        }
    }

    private fun feedbackLabel(feedback: PourFeedback): String = when (feedback) {
        PourFeedback.PERFECT_POUR -> "Perfect pour"
        PourFeedback.GOOD_POUR -> "Good pour"
        PourFeedback.TOO_LITTLE_LIQUID -> "Too little liquid"
        PourFeedback.TOO_MUCH_LIQUID -> "Too much liquid"
        PourFeedback.TOO_LITTLE_HEAD -> "Too little head"
        PourFeedback.TOO_MUCH_HEAD -> "Too much head"
        PourFeedback.OVERFLOWED -> "Overflowed"
        PourFeedback.UNDERFILLED -> "Underfilled"
    }

    private fun round1(value: Float): Float =
        kotlin.math.round(value * 10f) / 10f
}
