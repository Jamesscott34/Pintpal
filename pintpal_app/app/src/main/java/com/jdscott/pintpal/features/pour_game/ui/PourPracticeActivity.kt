/**
 * PourPracticeActivity.kt
 *
 * Purpose: Practice mode with progressive difficulty; submits personal best to profile + public board.
 * Connects to: TwoPartPourController, PourGameScoreRepository, pour_game_practice_activity.
 * Notes: Perfect Pour Accuracy only. Worse runs do not overwrite profile or public bests.
 */
package com.jdscott.pintpal.features.pour_game.ui

import android.annotation.SuppressLint
import android.os.Bundle
import android.view.MotionEvent
import android.widget.Button
import android.widget.TextView
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.lifecycleScope
import com.jdscott.pintpal.R
import com.jdscott.pintpal.features.games_common.domain.PourConfig
import com.jdscott.pintpal.features.games_common.domain.PourScore
import com.jdscott.pintpal.features.games_common.domain.PourState
import com.jdscott.pintpal.features.games_common.ui.PourGlassView
import com.jdscott.pintpal.features.pour_game.data.PourGameScoreRepository
import com.jdscott.pintpal.features.pour_game.domain.PourPhase
import com.jdscott.pintpal.features.pour_game.domain.PourScoreMode
import com.jdscott.pintpal.features.pour_game.domain.PourScoreSubmission
import com.jdscott.pintpal.features.pour_game.domain.PracticeLevels
import com.jdscott.pintpal.features.pour_game.domain.TwoPartPourController
import kotlinx.coroutines.launch

class PourPracticeActivity : AppCompatActivity(), TwoPartPourController.Listener {

    private lateinit var pourGlass: PourGlassView
    private lateinit var phaseText: TextView
    private lateinit var hintText: TextView
    private lateinit var scoreText: TextView
    private lateinit var levelText: TextView
    private lateinit var pourButton: Button
    private lateinit var controller: TwoPartPourController
    private val scoreRepository = PourGameScoreRepository()
    private var level: Int = 1

    @SuppressLint("ClickableViewAccessibility")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.pour_game_practice_activity)

        pourGlass = findViewById(R.id.pour_game_glass)
        phaseText = findViewById(R.id.pour_game_phase_text)
        hintText = findViewById(R.id.pour_game_hint_text)
        scoreText = findViewById(R.id.pour_game_score_text)
        levelText = findViewById(R.id.pour_game_level_text)
        pourButton = findViewById(R.id.pour_game_pour_button)

        pourGlass.isClickable = false
        pourGlass.isFocusable = false

        controller = TwoPartPourController(
            difficulty = PracticeLevels.get(level),
            listener = this,
        )
        hintText.text = controller.phaseHint()
        pourGlass.config = controller.currentConfig()
        refreshLevelLabel()

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
        syncGlass(state, config)
    }

    override fun onRoundComplete(score: PourScore) {
        scoreText.text = score.feedbackLabel
        updatePourButton()
        if (PracticeLevels.isSuccess(score.overallAccuracyPercent)) {
            val next = PracticeLevels.nextAfter(level)
            if (next.level > level) {
                level = next.level
                controller.setDifficulty(next)
                refreshLevelLabel()
                Toast.makeText(
                    this,
                    "Level cleared — now ${next.label}",
                    Toast.LENGTH_SHORT,
                ).show()
            }
        }
        submitPracticeScore(score)
    }

    private fun submitPracticeScore(score: PourScore) {
        lifecycleScope.launch {
            val result = scoreRepository.submitScore(
                PourScoreSubmission(
                    mode = PourScoreMode.PRACTICE,
                    score = score.overallAccuracyPercent.toDouble(),
                    level = level,
                    completedPours = 1,
                    bestSingleAccuracy = score.overallAccuracyPercent.toDouble(),
                ),
            )
            result.fold(
                onSuccess = { submit ->
                    val msg = when {
                        submit.personalBestUpdated && submit.publicBoardUpdated ->
                            getString(R.string.pour_game_saved_personal_best) + " (public board updated)"
                        submit.personalBestUpdated ->
                            getString(R.string.pour_game_saved_personal_best)
                        else -> getString(R.string.pour_game_not_personal_best)
                    }
                    Toast.makeText(this@PourPracticeActivity, msg, Toast.LENGTH_SHORT).show()
                },
                onFailure = {
                    Toast.makeText(
                        this@PourPracticeActivity,
                        getString(R.string.pour_game_sign_in_to_save),
                        Toast.LENGTH_SHORT,
                    ).show()
                },
            )
        }
    }

    private fun syncGlass(state: PourState, config: PourConfig) {
        pourGlass.config = config
        pourGlass.applyExternalState(state)
    }

    private fun refreshLevelLabel() {
        val d = PracticeLevels.get(level)
        levelText.text = getString(R.string.pour_game_level_fmt, d.level, d.label)
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
