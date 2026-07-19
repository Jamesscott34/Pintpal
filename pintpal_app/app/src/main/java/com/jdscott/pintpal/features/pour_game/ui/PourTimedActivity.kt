/**
 * PourTimedActivity.kt
 *
 * Purpose: Timed mode — 30/60/90/120s, as many complete pours as possible; sum of accuracies.
 * Connects to: TwoPartPourController, TimedPourScoring, PourGameScoreRepository.
 * Notes: Clock at zero locks input instantly. Submits personal best to profile + public board.
 */
package com.jdscott.pintpal.features.pour_game.ui

import android.annotation.SuppressLint
import android.os.Bundle
import android.os.CountDownTimer
import android.view.MotionEvent
import android.view.View
import android.widget.Button
import android.widget.RadioGroup
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
import com.jdscott.pintpal.features.pour_game.domain.TimedPourScoring
import com.jdscott.pintpal.features.pour_game.domain.TimedRunSummary
import com.jdscott.pintpal.features.pour_game.domain.TwoPartPourController
import kotlinx.coroutines.launch

class PourTimedActivity : AppCompatActivity(), TwoPartPourController.Listener {

    private lateinit var setupPanel: View
    private lateinit var runPanel: View
    private lateinit var durationGroup: RadioGroup
    private lateinit var clockText: TextView
    private lateinit var hudText: TextView
    private lateinit var hintText: TextView
    private lateinit var finishedText: TextView
    private lateinit var pourGlass: PourGlassView
    private lateinit var pourButton: Button
    private lateinit var newRunButton: Button
    private lateinit var controller: TwoPartPourController
    private val scoreRepository = PourGameScoreRepository()

    private var durationSeconds = 60
    private var summary: TimedRunSummary = TimedPourScoring.empty(60)
    private var timer: CountDownTimer? = null
    private var running = false

    @SuppressLint("ClickableViewAccessibility")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.pour_game_timed_activity)

        setupPanel = findViewById(R.id.pour_game_timed_setup)
        runPanel = findViewById(R.id.pour_game_timed_run)
        durationGroup = findViewById(R.id.pour_game_duration_group)
        clockText = findViewById(R.id.pour_game_clock)
        hudText = findViewById(R.id.pour_game_timed_hud)
        hintText = findViewById(R.id.pour_game_timed_hint)
        finishedText = findViewById(R.id.pour_game_timed_finished)
        pourGlass = findViewById(R.id.pour_game_timed_glass)
        pourButton = findViewById(R.id.pour_game_timed_pour)
        newRunButton = findViewById(R.id.pour_game_new_timed)

        pourGlass.isClickable = false
        pourGlass.isFocusable = false

        controller = TwoPartPourController(
            difficulty = PracticeLevels.LEVEL_1,
            listener = this,
        )

        findViewById<Button>(R.id.pour_game_start_timed).setOnClickListener { startRun() }
        newRunButton.setOnClickListener { backToSetup() }

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
    }

    override fun onDestroy() {
        timer?.cancel()
        controller.release()
        super.onDestroy()
    }

    override fun onPhaseChanged(phase: PourPhase) {
        hintText.text = controller.phaseHint()
        updatePourButton()
        if (running && phase == PourPhase.COMPLETE) {
            pourButton.postDelayed({
                if (running) controller.reset()
                updatePourButton()
            }, 500)
        }
    }

    override fun onStateChanged(state: PourState, config: PourConfig) {
        pourGlass.config = config
        pourGlass.applyExternalState(state)
    }

    override fun onRoundComplete(score: PourScore) {
        if (!running) return
        summary = TimedPourScoring.record(summary, score)
        refreshHud()
    }

    private fun selectedDuration(): Int = when (durationGroup.checkedRadioButtonId) {
        R.id.pour_game_dur_30 -> 30
        R.id.pour_game_dur_90 -> 90
        R.id.pour_game_dur_120 -> 120
        else -> 60
    }

    private fun startRun() {
        durationSeconds = selectedDuration()
        summary = TimedPourScoring.empty(durationSeconds)
        running = true
        setupPanel.visibility = View.GONE
        runPanel.visibility = View.VISIBLE
        finishedText.visibility = View.GONE
        newRunButton.visibility = View.GONE
        pourButton.visibility = View.VISIBLE
        controller.unlockInput()
        controller.reset()
        refreshHud()
        hintText.text = controller.phaseHint()
        updatePourButton()

        timer?.cancel()
        timer = object : CountDownTimer(durationSeconds * 1000L, 100L) {
            override fun onTick(millisUntilFinished: Long) {
                val sec = ((millisUntilFinished + 999) / 1000).toInt()
                clockText.text = "${sec}s"
            }

            override fun onFinish() {
                clockText.text = "0s"
                endRun()
            }
        }.start()
    }

    private fun endRun() {
        if (!running) return
        running = false
        timer?.cancel()
        controller.lockInput()
        updatePourButton()
        finishedText.visibility = View.VISIBLE
        finishedText.text = getString(R.string.pour_game_times_up) +
            "\nPours: ${summary.completedPours} · Accuracy sum: ${summary.accuracySum}" +
            " · Best single: ${summary.bestSingleAccuracy}%"
        newRunButton.visibility = View.VISIBLE
        pourButton.isEnabled = false
        submitTimedScore()
    }

    private fun backToSetup() {
        timer?.cancel()
        running = false
        controller.unlockInput()
        controller.reset()
        runPanel.visibility = View.GONE
        setupPanel.visibility = View.VISIBLE
    }

    private fun submitTimedScore() {
        lifecycleScope.launch {
            val result = scoreRepository.submitScore(
                PourScoreSubmission(
                    mode = PourScoreMode.TIMED,
                    score = summary.accuracySum.toDouble(),
                    durationSeconds = durationSeconds,
                    completedPours = summary.completedPours,
                    bestSingleAccuracy = summary.bestSingleAccuracy.toDouble(),
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
                    Toast.makeText(this@PourTimedActivity, msg, Toast.LENGTH_SHORT).show()
                },
                onFailure = {
                    Toast.makeText(
                        this@PourTimedActivity,
                        getString(R.string.pour_game_sign_in_to_save),
                        Toast.LENGTH_SHORT,
                    ).show()
                },
            )
        }
    }

    private fun refreshHud() {
        hudText.text =
            "Pours: ${summary.completedPours} · Accuracy sum: ${summary.accuracySum} · Best: ${summary.bestSingleAccuracy}%"
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
