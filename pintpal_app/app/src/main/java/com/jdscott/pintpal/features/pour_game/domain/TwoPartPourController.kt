/**
 * TwoPartPourController.kt
 *
 * Purpose: Guinness-style two-part pour state machine driving games_common simulation.
 * Connects to: PourPracticeActivity; PourSimulator, PourAccuracyScorer, PourSettleSimulator.
 * Notes: Practice mode has no timer. Local only in Stage 2.
 */
package com.jdscott.pintpal.features.pour_game.domain

import android.os.Handler
import android.os.Looper
import android.view.Choreographer
import com.jdscott.pintpal.features.games_common.domain.PourAccuracyScorer
import com.jdscott.pintpal.features.games_common.domain.PourConfig
import com.jdscott.pintpal.features.games_common.domain.PourInputMode
import com.jdscott.pintpal.features.games_common.domain.PourScore
import com.jdscott.pintpal.features.games_common.domain.PourSimulator
import com.jdscott.pintpal.features.games_common.domain.PourState
import kotlin.math.abs

class TwoPartPourController(
    difficulty: PracticeDifficulty = PracticeLevels.LEVEL_1,
    private val listener: Listener,
) {
    interface Listener {
        fun onPhaseChanged(phase: PourPhase)
        fun onStateChanged(state: PourState, config: PourConfig)
        fun onRoundComplete(score: PourScore)
    }

    var difficulty: PracticeDifficulty = difficulty
        private set

    var inputLocked: Boolean = false

    var phase: PourPhase = PourPhase.FIRST_POUR
        private set
    var state: PourState = PourState()
        private set

    private var pouring = false
    private var lastFrameNanos = 0L
    private var looping = false
    private val choreographer = Choreographer.getInstance()
    private val mainHandler = Handler(Looper.getMainLooper())
    private val frameCallback = object : Choreographer.FrameCallback {
        override fun doFrame(frameTimeNanos: Long) {
            if (!looping || inputLocked) {
                if (inputLocked) {
                    pouring = false
                    state = state.copy(isPouring = false)
                    stopLoop()
                }
                return
            }
            val now = frameTimeNanos
            val dt = if (lastFrameNanos == 0L) {
                0.016f
            } else {
                ((now - lastFrameNanos) / 1_000_000_000f).coerceAtMost(0.05f)
            }
            lastFrameNanos = now
            when (phase) {
                PourPhase.SETTLE -> {
                    state = PourSettleSimulator.advance(
                        state,
                        difficulty.phases.settledHead,
                        difficulty.phases.settleDurationSeconds,
                        dt,
                    )
                    listener.onStateChanged(state, currentConfig())
                    if (abs(state.headSize - difficulty.phases.settledHead) < 0.008f) {
                        setPhase(PourPhase.TOP_UP)
                        stopLoop()
                        return
                    }
                    choreographer.postFrameCallback(this)
                }
                PourPhase.FIRST_POUR, PourPhase.TOP_UP -> {
                    if (pouring) {
                        state = PourSimulator.advance(state, currentConfig(), dt)
                        listener.onStateChanged(state, currentConfig())
                        choreographer.postFrameCallback(this)
                    } else {
                        stopLoop()
                    }
                }
                else -> stopLoop()
            }
        }
    }

    fun currentConfig(): PourConfig {
        val finalPhase = phase == PourPhase.TOP_UP || phase == PourPhase.COMPLETE
        return PourConfig(
            pourSpeed = difficulty.pourSpeed,
            headRatio = if (phase == PourPhase.TOP_UP) 0.35f else 0.2f,
            targetLiquidLevel = if (finalPhase) {
                difficulty.phases.finalLiquid
            } else {
                difficulty.phases.firstPourLiquid
            },
            targetHeadSize = if (finalPhase) {
                difficulty.phases.finalHead
            } else {
                difficulty.phases.firstPourHead
            },
            liquidTolerance = difficulty.liquidTolerance,
            headTolerance = difficulty.headTolerance,
            failDistance = 0.4f,
            inputMode = PourInputMode.PRESS_AND_HOLD,
        )
    }

    fun phaseHint(): String = when (phase) {
        PourPhase.FIRST_POUR ->
            "First pour: hold to fill to about two-thirds, then release and let it settle."
        PourPhase.SETTLE ->
            "Settling… head is dropping. Wait for the top-up."
        PourPhase.TOP_UP ->
            "Top-up: hold to finish the pour — aim for the ideal head band."
        PourPhase.COMPLETE ->
            "Pour complete — check your Perfect Pour Accuracy."
    }

    fun canPour(): Boolean =
        !inputLocked && (phase == PourPhase.FIRST_POUR || phase == PourPhase.TOP_UP)

    fun setDifficulty(next: PracticeDifficulty) {
        difficulty = next
        listener.onStateChanged(state, currentConfig())
    }

    fun lockInput() {
        inputLocked = true
        pouring = false
        state = state.copy(isPouring = false)
        stopLoop()
        listener.onStateChanged(state, currentConfig())
    }

    fun unlockInput() {
        inputLocked = false
    }

    fun startPour() {
        if (!canPour() || pouring) return
        pouring = true
        state = state.copy(isPouring = true)
        listener.onStateChanged(state, currentConfig())
        ensureLoop()
    }

    fun stopPour() {
        if (!pouring) return
        pouring = false
        state = state.copy(isPouring = false)
        listener.onStateChanged(state, currentConfig())
        when (phase) {
            PourPhase.FIRST_POUR -> {
                setPhase(PourPhase.SETTLE)
                ensureLoop()
            }
            PourPhase.TOP_UP -> finishRound()
            else -> stopLoop()
        }
    }

    fun reset() {
        pouring = false
        stopLoop()
        phase = PourPhase.FIRST_POUR
        state = PourState()
        listener.onPhaseChanged(phase)
        listener.onStateChanged(state, currentConfig())
    }

    fun release() {
        pouring = false
        stopLoop()
    }

    private fun finishRound() {
        stopLoop()
        setPhase(PourPhase.COMPLETE)
        val score = PourAccuracyScorer.score(state, currentConfig())
        listener.onRoundComplete(score)
    }

    private fun setPhase(next: PourPhase) {
        phase = next
        listener.onPhaseChanged(phase)
        listener.onStateChanged(state, currentConfig())
    }

    private fun ensureLoop() {
        lastFrameNanos = 0L
        looping = true
        choreographer.removeFrameCallback(frameCallback)
        // Ensure we schedule on the main thread.
        mainHandler.post {
            choreographer.postFrameCallback(frameCallback)
        }
    }

    private fun stopLoop() {
        looping = false
        choreographer.removeFrameCallback(frameCallback)
        lastFrameNanos = 0L
    }
}
