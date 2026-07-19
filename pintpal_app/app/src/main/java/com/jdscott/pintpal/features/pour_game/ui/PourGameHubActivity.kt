/**
 * PourGameHubActivity.kt
 *
 * Purpose: Mode picker for Pour the Perfect Pint (practice, timed, scoreboard).
 * Connects to: PourPracticeActivity, PourTimedActivity, PourScoreboardActivity.
 */
package com.jdscott.pintpal.features.pour_game.ui

import android.content.Intent
import android.os.Bundle
import android.widget.Button
import androidx.appcompat.app.AppCompatActivity
import com.jdscott.pintpal.R

class PourGameHubActivity : AppCompatActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.pour_game_hub_activity)

        findViewById<Button>(R.id.pour_game_hub_practice).setOnClickListener {
            startActivity(Intent(this, PourPracticeActivity::class.java))
        }
        findViewById<Button>(R.id.pour_game_hub_timed).setOnClickListener {
            startActivity(Intent(this, PourTimedActivity::class.java))
        }
        findViewById<Button>(R.id.pour_game_hub_scoreboard).setOnClickListener {
            startActivity(Intent(this, PourScoreboardActivity::class.java))
        }
    }
}
