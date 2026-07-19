/**
 * PourSettleSimulator.kt
 *
 * Purpose: Pure settle step — head shrinks toward settled target during settle phase.
 * Connects to: TwoPartPourController; mirrored by web settlePour.ts.
 */
package com.jdscott.pintpal.features.pour_game.domain

import com.jdscott.pintpal.features.games_common.domain.PourState
import kotlin.math.abs

object PourSettleSimulator {

    fun advance(
        state: PourState,
        settledHead: Float,
        settleDurationSeconds: Float,
        dtSeconds: Float,
    ): PourState {
        if (dtSeconds <= 0f || settleDurationSeconds <= 0f) {
            return state
        }
        val rate = 1f / settleDurationSeconds
        val headDiff = state.headSize - settledHead
        if (abs(headDiff) < 0.001f) {
            return state.copy(headSize = settledHead, isPouring = false)
        }
        val step = headDiff * (rate * dtSeconds * 2.5f).coerceAtMost(1f)
        val newHead = state.headSize - step
        val converted = state.headSize - newHead
        return state.copy(
            headSize = newHead.coerceAtLeast(settledHead),
            liquidLevel = state.liquidLevel + converted * 0.85f,
            isPouring = false,
        )
    }
}
