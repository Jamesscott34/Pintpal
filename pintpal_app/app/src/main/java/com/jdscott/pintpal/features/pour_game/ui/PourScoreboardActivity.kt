/**
 * PourScoreboardActivity.kt
 *
 * Purpose: Public pour scoreboard + profile bests + opt-in toggle.
 * Connects to: PourGameScoreRepository (users + pour_game_scores).
 * Notes: Filter practice vs timed. Never mixes with ratings/contribution leaderboards.
 */
package com.jdscott.pintpal.features.pour_game.ui

import android.os.Bundle
import android.view.View
import android.widget.AdapterView
import android.widget.ArrayAdapter
import android.widget.CheckBox
import android.widget.RadioGroup
import android.widget.Spinner
import android.widget.TextView
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.lifecycleScope
import com.jdscott.pintpal.R
import com.jdscott.pintpal.features.pour_game.data.PourGameScoreRepository
import com.jdscott.pintpal.features.pour_game.domain.PourScoreMode
import com.jdscott.pintpal.features.pour_game.domain.TimedDurations
import kotlinx.coroutines.launch

class PourScoreboardActivity : AppCompatActivity() {

    private val repository = PourGameScoreRepository()
    private lateinit var profileBest: TextView
    private lateinit var optIn: CheckBox
    private lateinit var filterGroup: RadioGroup
    private lateinit var durationSpinner: Spinner
    private lateinit var status: TextView
    private lateinit var list: TextView
    private var selectedDuration = 60

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.pour_game_scoreboard_activity)

        profileBest = findViewById(R.id.pour_game_profile_best)
        optIn = findViewById(R.id.pour_game_opt_in)
        filterGroup = findViewById(R.id.pour_game_board_filter)
        durationSpinner = findViewById(R.id.pour_game_board_duration)
        status = findViewById(R.id.pour_game_board_status)
        list = findViewById(R.id.pour_game_board_list)

        val durations = TimedDurations.OPTIONS.map { "${it}s" }
        durationSpinner.adapter =
            ArrayAdapter(this, android.R.layout.simple_spinner_dropdown_item, durations)
        durationSpinner.setSelection(1) // 60s
        durationSpinner.onItemSelectedListener = object : AdapterView.OnItemSelectedListener {
            override fun onItemSelected(
                parent: AdapterView<*>?,
                view: View?,
                position: Int,
                id: Long,
            ) {
                selectedDuration = TimedDurations.OPTIONS[position]
                refreshBoard()
            }

            override fun onNothingSelected(parent: AdapterView<*>?) = Unit
        }

        filterGroup.setOnCheckedChangeListener { _, checkedId ->
            durationSpinner.visibility =
                if (checkedId == R.id.pour_game_board_timed) View.VISIBLE else View.GONE
            refreshBoard()
        }

        optIn.setOnCheckedChangeListener { _, isChecked ->
            lifecycleScope.launch {
                repository.setScoreboardOptIn(isChecked).fold(
                    onSuccess = { refreshBoard() },
                    onFailure = {
                        Toast.makeText(
                            this@PourScoreboardActivity,
                            getString(R.string.pour_game_sign_in_to_save),
                            Toast.LENGTH_SHORT,
                        ).show()
                        optIn.isChecked = !isChecked
                    },
                )
            }
        }

        loadProfile()
        refreshBoard()
    }

    private fun loadProfile() {
        lifecycleScope.launch {
            val user = repository.loadCurrentUser()
            if (user == null) {
                profileBest.text = getString(R.string.pour_game_sign_in_to_save)
                optIn.isEnabled = false
                return@launch
            }
            optIn.isEnabled = true
            optIn.setOnCheckedChangeListener(null)
            optIn.isChecked = user.pourGameScoreboardOptIn
            optIn.setOnCheckedChangeListener { _, isChecked ->
                lifecycleScope.launch {
                    repository.setScoreboardOptIn(isChecked)
                }
            }
            val practice = user.pourGameBestPracticeAccuracy?.let { "%.1f%%".format(it) } ?: "—"
            val timed = user.pourGameBestTimedAccuracySums.entries
                .sortedBy { it.key.toIntOrNull() ?: 0 }
                .joinToString { "${it.key}s: ${"%.1f".format(it.value)}" }
                .ifBlank { "—" }
            profileBest.text = "Your profile · Practice best: $practice · Timed bests: $timed"
        }
    }

    private fun refreshBoard() {
        val mode = if (filterGroup.checkedRadioButtonId == R.id.pour_game_board_timed) {
            PourScoreMode.TIMED
        } else {
            PourScoreMode.PRACTICE
        }
        status.text = "Loading…"
        lifecycleScope.launch {
            val duration = if (mode == PourScoreMode.TIMED) selectedDuration else null
            repository.loadPublicScoreboard(mode, duration).fold(
                onSuccess = { entries ->
                    status.text = if (entries.isEmpty()) {
                        "No public scores yet for this filter."
                    } else {
                        "${entries.size} public entries (Perfect Pour Accuracy skill)"
                    }
                    list.text = entries.mapIndexed { index, e ->
                        val extra = when (mode) {
                            PourScoreMode.PRACTICE ->
                                e.level?.let { " · lvl $it" } ?: ""
                            PourScoreMode.TIMED ->
                                " · ${e.durationSeconds ?: "?"}s · ${e.completedPours} pours"
                        }
                        "${index + 1}. ${e.displayName} — ${"%.1f".format(e.score)}$extra"
                    }.joinToString("\n")
                },
                onFailure = { err ->
                    status.text = "Could not load scoreboard: ${err.message}"
                    list.text = ""
                },
            )
        }
    }
}
