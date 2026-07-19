/**
 * PourGlassView.kt
 *
 * Purpose: Custom View — glass outline, rising liquid, separate head/foam layer, pour input.
 * Connects to: PourSimulator + PourAccuracyScorer; layouts via games_common_demo_activity.
 * Notes: Stage 1 local mechanic. Press-and-hold or tap-to-toggle. No Firestore.
 */
package com.jdscott.pintpal.features.games_common.ui

import android.content.Context
import android.graphics.Canvas
import android.graphics.Paint
import android.graphics.Path
import android.graphics.RectF
import android.util.AttributeSet
import android.view.MotionEvent
import android.view.View
import com.jdscott.pintpal.features.games_common.domain.PourAccuracyScorer
import com.jdscott.pintpal.features.games_common.domain.PourConfig
import com.jdscott.pintpal.features.games_common.domain.PourInputMode
import com.jdscott.pintpal.features.games_common.domain.PourScore
import com.jdscott.pintpal.features.games_common.domain.PourSimulator
import com.jdscott.pintpal.features.games_common.domain.PourState

class PourGlassView @JvmOverloads constructor(
    context: Context,
    attrs: AttributeSet? = null,
    defStyleAttr: Int = 0,
) : View(context, attrs, defStyleAttr) {

    interface Listener {
        fun onPourScored(score: PourScore)
        fun onPourStateChanged(state: PourState) {}
    }

    var listener: Listener? = null
    var inputLocked: Boolean = false
        set(value) {
            field = value
            if (value && state.isPouring) {
                stopPour()
            }
        }

    var config: PourConfig = PourConfig()
        set(value) {
            field = value
            invalidate()
        }

    var state: PourState = PourState()
        private set

    private var lastScore: PourScore? = null
    private var lastFrameNanos: Long = 0L
    private var looping: Boolean = false

    private val glassPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
        style = Paint.Style.STROKE
        strokeWidth = 6f
        color = 0x8CF2EFE6.toInt()
    }
    private val liquidPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
        style = Paint.Style.FILL
    }
    private val headPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
        style = Paint.Style.FILL
    }
    private val targetPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
        style = Paint.Style.FILL
        color = 0x38C4A35A
    }
    private val targetStrokePaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
        style = Paint.Style.STROKE
        strokeWidth = 2f
        color = 0xB3C4A35A.toInt()
    }
    private val glassPath = Path()
    private val clipPath = Path()
    private val glassRect = RectF()

    private val frameCallback = object : Runnable {
        override fun run() {
            if (!looping) return
            val now = System.nanoTime()
            val dt = if (lastFrameNanos == 0L) {
                0.016f
            } else {
                ((now - lastFrameNanos) / 1_000_000_000f).coerceAtMost(0.05f)
            }
            lastFrameNanos = now
            state = PourSimulator.advance(state, config, dt)
            listener?.onPourStateChanged(state)
            invalidate()
            postOnAnimation(this)
        }
    }

    fun startPour() {
        if (inputLocked || state.isPouring) return
        state = state.copy(isPouring = true)
        looping = true
        lastFrameNanos = 0L
        listener?.onPourStateChanged(state)
        postOnAnimation(frameCallback)
    }

    fun stopPour() {
        if (!state.isPouring) return
        looping = false
        removeCallbacks(frameCallback)
        state = state.copy(isPouring = false)
        val score = PourAccuracyScorer.score(state, config)
        lastScore = score
        listener?.onPourStateChanged(state)
        listener?.onPourScored(score)
        invalidate()
    }

    fun togglePour() {
        if (state.isPouring) stopPour() else startPour()
    }

    fun resetGlass() {
        looping = false
        removeCallbacks(frameCallback)
        state = PourState()
        lastScore = null
        listener?.onPourStateChanged(state)
        invalidate()
    }

    /**
     * Lets a parent game controller (e.g. two-part pour) drive liquid/head levels
     * while this view remains display-only.
     */
    fun applyExternalState(external: PourState) {
        looping = false
        removeCallbacks(frameCallback)
        state = external.copy(isPouring = false)
        invalidate()
    }

    fun scoreNow(): PourScore = PourAccuracyScorer.score(state, config)

    fun getLastScore(): PourScore? = lastScore

    override fun onDetachedFromWindow() {
        looping = false
        removeCallbacks(frameCallback)
        super.onDetachedFromWindow()
    }

    override fun onTouchEvent(event: MotionEvent): Boolean {
        if (inputLocked) return super.onTouchEvent(event)
        when (config.inputMode) {
            PourInputMode.PRESS_AND_HOLD -> when (event.actionMasked) {
                MotionEvent.ACTION_DOWN -> {
                    startPour()
                    return true
                }
                MotionEvent.ACTION_UP, MotionEvent.ACTION_CANCEL -> {
                    stopPour()
                    return true
                }
            }
            PourInputMode.TAP_TO_TOGGLE -> if (event.actionMasked == MotionEvent.ACTION_UP) {
                togglePour()
                return true
            }
        }
        return super.onTouchEvent(event)
    }

    override fun onDraw(canvas: Canvas) {
        super.onDraw(canvas)
        val pad = glassPaint.strokeWidth
        glassRect.set(pad, pad, width - pad, height - pad)

        glassPath.reset()
        glassPath.moveTo(glassRect.left, glassRect.top)
        glassPath.lineTo(glassRect.right, glassRect.top)
        glassPath.lineTo(glassRect.right - glassRect.width() * 0.08f, glassRect.bottom)
        glassPath.quadTo(
            glassRect.centerX(),
            glassRect.bottom + glassRect.height() * 0.04f,
            glassRect.left + glassRect.width() * 0.08f,
            glassRect.bottom,
        )
        glassPath.close()

        clipPath.set(glassPath)
        canvas.save()
        canvas.clipPath(clipPath)

        val (dispLiquid, dispHead) = PourSimulator.displayLevels(state)
        val targetBottom = glassRect.bottom - config.targetLiquidLevel * glassRect.height()
        val targetTop =
            glassRect.bottom -
                (config.targetLiquidLevel + config.targetHeadSize) * glassRect.height()
        canvas.drawRect(glassRect.left, targetTop, glassRect.right, targetBottom, targetPaint)
        canvas.drawLine(glassRect.left, targetTop, glassRect.right, targetTop, targetStrokePaint)
        canvas.drawLine(glassRect.left, targetBottom, glassRect.right, targetBottom, targetStrokePaint)

        liquidPaint.color = config.liquidColor
        headPaint.color = config.headColor
        val liquidTop = glassRect.bottom - dispLiquid * glassRect.height()
        canvas.drawRect(glassRect.left, liquidTop, glassRect.right, glassRect.bottom, liquidPaint)
        val headTop = liquidTop - dispHead * glassRect.height()
        canvas.drawRect(glassRect.left, headTop, glassRect.right, liquidTop, headPaint)

        canvas.restore()
        canvas.drawPath(glassPath, glassPaint)
    }
}
