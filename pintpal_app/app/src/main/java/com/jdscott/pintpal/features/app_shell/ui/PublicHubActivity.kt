/**
 * PublicHubActivity.kt
 *
 * Purpose: Android Public section — games, chats, ratings, scoreboard.
 * Connects to: PourGameHubActivity, PourScoreboardActivity, PrivateProfileActivity.
 */
package com.jdscott.pintpal.features.app_shell.ui

import android.content.Intent
import android.os.Bundle
import android.widget.Button
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.lifecycleScope
import com.jdscott.pintpal.R
import com.jdscott.pintpal.features.auth.data.AuthRepository
import com.jdscott.pintpal.features.auth.ui.AuthLoginActivity
import com.jdscott.pintpal.features.pour_game.ui.PourGameHubActivity
import com.jdscott.pintpal.features.pour_game.ui.PourScoreboardActivity
import com.jdscott.pintpal.features.ratings.ui.BestPintsActivity
import kotlinx.coroutines.launch

class PublicHubActivity : AppCompatActivity() {

    private val authRepository = AuthRepository()

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.app_shell_public_activity)
        supportActionBar?.setDisplayHomeAsUpEnabled(true)
        title = getString(R.string.app_shell_public_title)

        lifecycleScope.launch {
            val document = authRepository.loadCurrentUserDocument().getOrNull()
            if (document == null) {
                startActivity(Intent(this@PublicHubActivity, AuthLoginActivity::class.java))
                finish()
            }
        }

        findViewById<Button>(R.id.app_shell_open_pour).setOnClickListener {
            startActivity(Intent(this, PourGameHubActivity::class.java))
        }
        findViewById<Button>(R.id.app_shell_open_serving).setOnClickListener {
            startActivity(Intent(this, com.jdscott.pintpal.features.serving_game.ui.ServingRushActivity::class.java))
        }
        findViewById<Button>(R.id.app_shell_open_scoreboard).setOnClickListener {
            startActivity(Intent(this, PourScoreboardActivity::class.java))
        }
        findViewById<Button>(R.id.app_shell_open_ratings).setOnClickListener {
            startActivity(Intent(this, BestPintsActivity::class.java))
        }
        findViewById<Button>(R.id.app_shell_open_drinks).setOnClickListener {
            startActivity(Intent(this, com.jdscott.pintpal.features.drinks.ui.DrinkRatingsActivity::class.java))
        }
        findViewById<Button>(R.id.app_shell_open_private).setOnClickListener {
            startActivity(Intent(this, PrivateProfileActivity::class.java))
        }
    }

    override fun onSupportNavigateUp(): Boolean {
        finish()
        return true
    }
}
