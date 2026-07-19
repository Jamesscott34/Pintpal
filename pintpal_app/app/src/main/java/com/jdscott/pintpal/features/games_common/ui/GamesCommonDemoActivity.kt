/**
 * GamesCommonDemoActivity.kt
 *
 * Purpose: Stage 1 verification screen for the shared pour mechanic on Android.
 * Connects to: PourGlassView, PourAccuracyScorer; launched for manual / QA checks.
 * Notes: Local only — no Firestore. Confirms animation + deterministic scoring.
 */
package com.jdscott.pintpal.features.games_common.ui

import android.os.Bundle
import android.widget.Button
import android.widget.TextView
import androidx.appcompat.app.AppCompatActivity
import com.jdscott.pintpal.R
import com.jdscott.pintpal.features.games_common.domain.PourAccuracyScorer
import com.jdscott.pintpal.features.games_common.domain.PourConfig
import com.jdscott.pintpal.features.games_common.domain.PourScore
import com.jdscott.pintpal.features.games_common.domain.PourState

class GamesCommonDemoActivity : AppCompatActivity(), PourGlassView.Listener {

    private lateinit var pourGlass: PourGlassView
    private lateinit var scoreText: TextView
    private lateinit var consistencyText: TextView

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.games_common_demo_activity)

        pourGlass = findViewById(R.id.games_common_pour_glass)
        scoreText = findViewById(R.id.games_common_score_text)
        consistencyText = findViewById(R.id.games_common_consistency_text)

        pourGlass.config = PourConfig(
            pourSpeed = 0.28f,
            liquidTolerance = 0.08f,
            headTolerance = 0.06f,
        )
        pourGlass.listener = this

        findViewById<Button>(R.id.games_common_reset_button).setOnClickListener {
            pourGlass.resetGlass()
            scoreText.setText(R.string.games_common_score_hint)
        }
        findViewById<Button>(R.id.games_common_consistency_button).setOnClickListener {
            runConsistencyCheck()
        }
    }

    override fun onPourScored(score: PourScore) {
        scoreText.text = score.feedbackLabel
    }

    private fun runConsistencyCheck() {
        val fixture = PourState(liquidLevel = 0.72f, headSize = 0.18f)
        val config = PourConfig()
        val a = PourAccuracyScorer.score(fixture, config)
        val b = PourAccuracyScorer.score(fixture, config)
        val c = PourAccuracyScorer.score(fixture, config)
        val same =
            a.overallAccuracyPercent == b.overallAccuracyPercent &&
                b.overallAccuracyPercent == c.overallAccuracyPercent &&
                a.feedback == b.feedback &&
                b.feedback == c.feedback
        consistencyText.text = buildString {
            appendLine("Run 1: ${a.feedbackLabel}")
            appendLine("Run 2: ${b.feedbackLabel}")
            appendLine("Run 3: ${c.feedbackLabel}")
            append(
                if (same) {
                    "PASS — identical scores across three runs for the same input."
                } else {
                    "FAIL — scores diverged; scorer must be deterministic."
                },
            )
        }
    }
}
