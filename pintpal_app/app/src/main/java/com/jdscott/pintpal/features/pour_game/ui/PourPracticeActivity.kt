/**
 * PourPracticeActivity.kt
 *
 * Purpose: Stage 2 practice UI for Pour the Perfect Pint (two-part pour, no timer).
 * Connects to: TwoPartPourController + PourGlassView; layout pour_game_practice_activity.
 * Notes: Easy difficulty. Local only — no Firestore.
 */
package com.jdscott.pintpal.features.pour_game.ui

import android.annotation.SuppressLint
import android.os.Bundle
import android.view.MotionEvent
import android.widget.Button
import android.widget.TextView
import androidx.appcompat.app.AppCompatActivity
import com.jdscott.pintpal.R
import com.jdscott.pintpal.features.games_common.domain.PourConfig
import com.jdscott.pintpal.features.games_common.domain.PourScore
import com.jdscott.pintpal.features.games_common.domain.PourState
import com.jdscott.pintpal.features.games_common.ui.PourGlassView
import com.jdscott.pintpal.features.pour_game.domain.PourPhase
import com.jdscott.pintpal.features.pour_game.domain.TwoPartPourController

class PourPracticeActivity : AppCompatActivity(), TwoPartPourController.Listener {

    private lateinit var pourGlass: PourGlassView
    private lateinit var phaseText: TextView
    private lateinit var hintText: TextView
    private lateinit var scoreText: TextView
    private lateinit var pourButton: Button
    private lateinit var controller: TwoPartPourController

    @SuppressLint("ClickableViewAccessibility")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.pour_game_practice_activity)

        pourGlass = findViewById(R.id.pour_game_glass)
        phaseText = findViewById(R.id.pour_game_phase_text)
        hintText = findViewById(R.id.pour_game_hint_text)
        scoreText = findViewById(R.id.pour_game_score_text)
        pourButton = findViewById(R.id.pour_game_pour_button)

        // Glass is display-only; pour input is on the button so settle phase stays locked.
        pourGlass.isClickable = false
        pourGlass.isFocusable = false

        controller = TwoPartPourController(listener = this)
        hintText.text = controller.phaseHint()
        pourGlass.config = controller.currentConfig()

        pourButton.setOnTouchListener { _, event ->
            when (event.actionMasked) {
                MotionEvent.ACTION_DOWN -> {
                    controller.startPour()
                    true
                }
                MotionEvent.ACTION_UP, MotionEvent.ACTION_CANCEL -> {
                    controller.stopPour()
                    true
                }
                else -> false
            }
        }

        findViewById<Button>(R.id.pour_game_reset_button).setOnClickListener {
            controller.reset()
            scoreText.text = ""
            updatePourButton()
        }

        updatePhaseLabel(PourPhase.FIRST_POUR)
        updatePourButton()
    }

    override fun onDestroy() {
        controller.release()
        super.onDestroy()
    }

    override fun onPhaseChanged(phase: PourPhase) {
        updatePhaseLabel(phase)
        hintText.text = controller.phaseHint()
        updatePourButton()
    }

    override fun onStateChanged(state: PourState, config: PourConfig) {
        pourGlass.config = config
        // Reflect simulated state into the view by resetting then applying via reflection-free API:
        // PourGlassView owns its state; sync by drawing from a mirror field.
        syncGlass(state, config)
    }

    override fun onRoundComplete(score: PourScore) {
        scoreText.text = score.feedbackLabel
        updatePourButton()
    }

    private fun syncGlass(state: PourState, config: PourConfig) {
        pourGlass.config = config
        pourGlass.applyExternalState(state)
    }

    private fun updatePhaseLabel(phase: PourPhase) {
        phaseText.text = when (phase) {
            PourPhase.FIRST_POUR -> getString(R.string.pour_game_phase_first)
            PourPhase.SETTLE -> getString(R.string.pour_game_phase_settle)
            PourPhase.TOP_UP -> getString(R.string.pour_game_phase_top_up)
            PourPhase.COMPLETE -> getString(R.string.pour_game_phase_complete)
        }
    }

    private fun updatePourButton() {
        val canPour = controller.canPour()
        pourButton.isEnabled = canPour
        pourButton.text = when {
            !canPour && controller.phase == PourPhase.SETTLE ->
                getString(R.string.pour_game_settling)
            !canPour -> getString(R.string.pour_game_pour_finished)
            else -> getString(R.string.pour_game_hold_to_pour)
        }
    }
}
