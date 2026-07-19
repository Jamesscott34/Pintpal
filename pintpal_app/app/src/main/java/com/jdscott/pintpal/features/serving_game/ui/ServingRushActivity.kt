/**
 * ServingRushActivity.kt
 *
 * Purpose: Android Serving Rush — pick correct tap, then pour with PourGlassView.
 */
package com.jdscott.pintpal.features.serving_game.ui

import android.os.Bundle
import android.os.CountDownTimer
import android.view.View
import android.widget.Button
import android.widget.LinearLayout
import android.widget.TextView
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.lifecycleScope
import com.jdscott.pintpal.R
import com.jdscott.pintpal.features.games_common.domain.PourScore
import com.jdscott.pintpal.features.games_common.domain.PourState
import com.jdscott.pintpal.features.games_common.ui.PourGlassView
import com.jdscott.pintpal.features.serving_game.data.ServingGameScoreRepository
import com.jdscott.pintpal.features.serving_game.domain.ServingDrinks
import kotlinx.coroutines.launch
import kotlin.math.max
import kotlin.math.roundToInt

class ServingRushActivity : AppCompatActivity(), PourGlassView.Listener {

    private val scoreRepo = ServingGameScoreRepository()
    private var phase = Phase.IDLE
    private var orderIndex = 0
    private var currentDrink = ServingDrinks.randomId()
    private var score = 0
    private var misses = 0
    private var completed = 0
    private var missLocked = false
    private var timer: CountDownTimer? = null

    private lateinit var status: TextView
    private lateinit var stats: TextView
    private lateinit var orderLabel: TextView
    private lateinit var taps: LinearLayout
    private lateinit var glass: PourGlassView
    private lateinit var startButton: Button

    private enum class Phase { IDLE, PICK_TAP, POURING, FINISHED }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.serving_game_activity)
        supportActionBar?.setDisplayHomeAsUpEnabled(true)
        title = getString(R.string.serving_game_title)

        status = findViewById(R.id.serving_status)
        stats = findViewById(R.id.serving_stats)
        orderLabel = findViewById(R.id.serving_order)
        taps = findViewById(R.id.serving_taps)
        glass = findViewById(R.id.serving_glass)
        startButton = findViewById(R.id.serving_start)

        ServingDrinks.ALL.forEach { drink ->
            val btn = Button(this).apply {
                text = drink.label
                setOnClickListener { onTap(drink.id) }
            }
            taps.addView(btn)
        }

        glass.listener = this
        startButton.setOnClickListener { startRun() }
        renderIdle()
    }

    override fun onDestroy() {
        timer?.cancel()
        super.onDestroy()
    }

    override fun onSupportNavigateUp(): Boolean {
        finish()
        return true
    }

    override fun onPourScored(score: PourScore) {
        onPourScore(score)
    }

    override fun onPourStateChanged(state: PourState) = Unit

    private fun startRun() {
        timer?.cancel()
        missLocked = false
        score = 0
        misses = 0
        completed = 0
        orderIndex = 0
        currentDrink = ServingDrinks.randomId()
        phase = Phase.PICK_TAP
        startButton.visibility = View.GONE
        glass.visibility = View.GONE
        taps.visibility = View.VISIBLE
        orderLabel.visibility = View.VISIBLE
        status.text = getString(R.string.serving_pick_tap)
        refreshStats(ServingDrinks.ORDER_SECONDS)
        showOrder()
        startOrderTimer()
    }

    private fun showOrder() {
        orderLabel.text = getString(
            R.string.serving_order_fmt,
            ServingDrinks.byId(currentDrink).label,
        )
    }

    private fun startOrderTimer() {
        timer?.cancel()
        timer = object : CountDownTimer(ServingDrinks.ORDER_SECONDS * 1000L, 1000L) {
            override fun onTick(millisUntilFinished: Long) {
                refreshStats((millisUntilFinished / 1000L).toInt())
            }

            override fun onFinish() {
                registerMiss(getString(R.string.serving_timeout))
            }
        }.start()
    }

    private fun onTap(id: String) {
        if (phase != Phase.PICK_TAP) return
        if (id != currentDrink) {
            registerMiss(getString(R.string.serving_wrong_tap))
            return
        }
        phase = Phase.POURING
        taps.visibility = View.GONE
        glass.visibility = View.VISIBLE
        glass.config = ServingDrinks.byId(id).pourConfig
        glass.resetGlass()
        status.text = getString(R.string.serving_pour_now)
    }

    private fun onPourScore(pourScore: PourScore) {
        if (phase != Phase.POURING || missLocked) return
        missLocked = true
        timer?.cancel()
        val gained = pourScore.overallAccuracyPercent.roundToInt()
        score += gained
        completed += 1
        status.text = "${pourScore.feedbackLabel} (+$gained)"
        advance()
    }

    private fun registerMiss(reason: String) {
        if (missLocked || phase == Phase.IDLE || phase == Phase.FINISHED) return
        missLocked = true
        timer?.cancel()
        misses += 1
        score = max(0, score - ServingDrinks.MISS_PENALTY)
        status.text = "$reason (−${ServingDrinks.MISS_PENALTY})"
        advance()
    }

    private fun advance() {
        orderIndex += 1
        if (orderIndex >= ServingDrinks.ORDERS_PER_RUN) {
            finishRun()
            return
        }
        missLocked = false
        currentDrink = ServingDrinks.randomId(exclude = currentDrink)
        phase = Phase.PICK_TAP
        glass.visibility = View.GONE
        taps.visibility = View.VISIBLE
        showOrder()
        status.text = getString(R.string.serving_pick_tap)
        startOrderTimer()
    }

    private fun finishRun() {
        phase = Phase.FINISHED
        timer?.cancel()
        taps.visibility = View.GONE
        glass.visibility = View.GONE
        orderLabel.visibility = View.GONE
        startButton.visibility = View.VISIBLE
        startButton.text = getString(R.string.serving_play_again)
        refreshStats(0)
        lifecycleScope.launch {
            scoreRepo.submitScore(score, completed, misses)
                .onSuccess { result ->
                    status.text = when {
                        result.publicBoardUpdated ->
                            getString(R.string.serving_saved_public)
                        result.personalBestUpdated ->
                            getString(R.string.serving_saved_best)
                        else -> getString(R.string.serving_saved)
                    }
                }
                .onFailure { err ->
                    status.text = err.message ?: getString(R.string.serving_save_failed)
                }
        }
    }

    private fun renderIdle() {
        phase = Phase.IDLE
        taps.visibility = View.GONE
        glass.visibility = View.GONE
        orderLabel.visibility = View.GONE
        startButton.visibility = View.VISIBLE
        startButton.text = getString(R.string.serving_start)
        status.text = getString(R.string.serving_idle_hint)
        refreshStats(0)
    }

    private fun refreshStats(secondsLeft: Int) {
        stats.text = getString(
            R.string.serving_stats_fmt,
            score,
            (orderIndex + 1).coerceAtMost(ServingDrinks.ORDERS_PER_RUN),
            ServingDrinks.ORDERS_PER_RUN,
            misses,
            secondsLeft,
        )
    }
}
