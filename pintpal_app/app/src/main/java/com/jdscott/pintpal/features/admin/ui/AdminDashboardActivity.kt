/**
 * AdminDashboardActivity.kt
 *
 * Purpose: Android admin dashboard — all users + shortcuts to public areas.
 * Connects to: AdminUsersRepository, PublicHubActivity. Requires canViewAdmin.
 */
package com.jdscott.pintpal.features.admin.ui

import android.content.Intent
import android.os.Bundle
import android.view.View
import android.widget.Button
import android.widget.LinearLayout
import android.widget.TextView
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.lifecycleScope
import com.jdscott.pintpal.R
import com.jdscott.pintpal.features.admin.data.AdminUsersRepository
import com.jdscott.pintpal.features.app_shell.ui.PublicHubActivity
import com.jdscott.pintpal.features.auth.data.AuthRepository
import com.jdscott.pintpal.features.auth.ui.AuthLoginActivity
import com.jdscott.pintpal.features.pour_game.ui.PourGameHubActivity
import com.jdscott.pintpal.features.pour_game.ui.PourScoreboardActivity
import com.jdscott.pintpal.utilities.UserPermissions
import kotlinx.coroutines.launch

class AdminDashboardActivity : AppCompatActivity() {

    private val authRepository = AuthRepository()
    private val usersRepository = AdminUsersRepository()

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.admin_dashboard_activity)
        supportActionBar?.setDisplayHomeAsUpEnabled(true)
        title = getString(R.string.admin_dashboard_title)

        val status = findViewById<TextView>(R.id.admin_status)
        val usersList = findViewById<LinearLayout>(R.id.admin_users_list)

        findViewById<Button>(R.id.admin_open_games).setOnClickListener {
            startActivity(Intent(this, PourGameHubActivity::class.java))
        }
        findViewById<Button>(R.id.admin_open_scoreboard).setOnClickListener {
            startActivity(Intent(this, PourScoreboardActivity::class.java))
        }
        findViewById<Button>(R.id.admin_open_public).setOnClickListener {
            startActivity(Intent(this, PublicHubActivity::class.java))
        }

        lifecycleScope.launch {
            val document = authRepository.loadCurrentUserDocument().getOrNull()
            if (document == null) {
                startActivity(Intent(this@AdminDashboardActivity, AuthLoginActivity::class.java))
                finish()
                return@launch
            }
            if (!UserPermissions.canViewAdmin(document.toPermissionFlags())) {
                status.text = getString(R.string.admin_access_denied)
                status.visibility = View.VISIBLE
                return@launch
            }

            status.text = getString(R.string.admin_loading_users)
            status.visibility = View.VISIBLE
            usersRepository.listAllUsers()
                .onSuccess { users ->
                    status.visibility = View.GONE
                    usersList.removeAllViews()
                    users.forEach { user ->
                        val plan =
                            if (user.canViewAdmin || user.subscriptionPaid || user.displayRole.equals("admin", true)) {
                                "paid"
                            } else {
                                "free"
                            }
                        val row = TextView(this@AdminDashboardActivity).apply {
                            text = buildString {
                                append(user.name.ifBlank { "—" })
                                append(" · ")
                                append(user.email.ifBlank { "—" })
                                append('\n')
                                append("Role: ")
                                append(user.displayRole)
                                if (user.role != user.displayRole) {
                                    append(" (profile field: ")
                                    append(user.role)
                                    append(')')
                                }
                                append(" · login ")
                                append(if (user.canLogin) "yes" else "no")
                                append(" · ")
                                append(plan)
                                append('\n')
                                append(user.uid)
                            }
                            setTextColor(getColor(R.color.games_common_muted))
                            setPadding(0, 24, 0, 24)
                        }
                        usersList.addView(row)
                    }
                    if (users.isEmpty()) {
                        status.text = getString(R.string.admin_no_users)
                        status.visibility = View.VISIBLE
                    }
                }
                .onFailure { err ->
                    status.text = err.message ?: getString(R.string.admin_users_failed)
                    status.visibility = View.VISIBLE
                }
        }
    }

    override fun onSupportNavigateUp(): Boolean {
        finish()
        return true
    }
}
