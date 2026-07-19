/**
 * PourSimulator.kt
 *
 * Purpose: Pure step function that advances liquid + head while pouring.
 * Connects to: PourGlassView animation loop; mirrored by web advancePour.ts.
 * Notes: Deterministic for a fixed dt. No networking.
 */
package com.jdscott.pintpal.features.games_common.domain

object PourSimulator {

    fun advance(state: PourState, config: PourConfig, dtSeconds: Float): PourState {
        if (!state.isPouring || dtSeconds <= 0f) {
            return state
        }

        val poured = config.pourSpeed * dtSeconds
        val headRatio = config.headRatio.coerceIn(0f, 1f)
        var liquidLevel = state.liquidLevel + poured * (1f - headRatio)
        var headSize = state.headSize + poured * headRatio
        val total = liquidLevel + headSize
        val isOverflowed = state.isOverflowed || total > 1f

        if (total > 1.5f) {
            val scale = 1.5f / total
            liquidLevel *= scale
            headSize *= scale
        }

        return state.copy(
            liquidLevel = liquidLevel,
            headSize = headSize,
            isOverflowed = isOverflowed,
        )
    }

    /** Display-clamped levels for drawing (never above the rim). */
    fun displayLevels(state: PourState): Pair<Float, Float> {
        val total = state.liquidLevel + state.headSize
        if (total <= 1f) {
            return state.liquidLevel to state.headSize
        }
        val scale = 1f / total
        return (state.liquidLevel * scale) to (state.headSize * scale)
    }
}
