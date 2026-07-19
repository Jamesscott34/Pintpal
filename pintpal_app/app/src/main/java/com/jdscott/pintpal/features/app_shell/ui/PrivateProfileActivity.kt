/**
 * PrivateProfileActivity.kt
 *
 * Purpose: Android Private section — friendly profile for members; admin details + dashboard.
 * Connects to: AuthRepository, AdminDashboardActivity, PublicHubActivity.
 */
package com.jdscott.pintpal.features.app_shell.ui

import android.content.Intent
import android.os.Bundle
import android.view.View
import android.widget.Button
import android.widget.TextView
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.lifecycleScope
import com.jdscott.pintpal.R
import com.jdscott.pintpal.features.admin.ui.AdminDashboardActivity
import com.jdscott.pintpal.features.auth.data.AuthRepository
import com.jdscott.pintpal.features.auth.ui.AuthLoginActivity
import com.jdscott.pintpal.utilities.UserPermissions
import kotlinx.coroutines.launch

class PrivateProfileActivity : AppCompatActivity() {

    private val authRepository = AuthRepository()

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.app_shell_private_activity)
        supportActionBar?.setDisplayHomeAsUpEnabled(true)
        title = getString(R.string.app_shell_private_title)

        val bodyView = findViewById<TextView>(R.id.app_shell_private_body)
        val adminDetails = findViewById<TextView>(R.id.app_shell_private_admin_details)
        val adminButton = findViewById<Button>(R.id.app_shell_open_admin)

        lifecycleScope.launch {
            val document = authRepository.loadCurrentUserDocument().getOrNull()
            if (document == null) {
                startActivity(Intent(this@PrivateProfileActivity, AuthLoginActivity::class.java))
                finish()
                return@launch
            }
            val flags = document.toPermissionFlags()
            val paid = UserPermissions.isSubscriptionPaid(flags)
            val photoLine = if (paid) {
                getString(R.string.auth_subscription_paid)
            } else {
                getString(
                    R.string.auth_subscription_free,
                    UserPermissions.remainingPhotoUploadsToday(flags),
                )
            }
            bodyView.text = buildString {
                appendLine(document.name)
                appendLine(document.email)
                append("Plan: ")
                appendLine(if (paid) "Paid" else "Free")
                append(photoLine)
            }

            if (UserPermissions.canViewAdmin(flags)) {
                adminDetails.visibility = View.VISIBLE
                adminDetails.text = buildString {
                    appendLine(getString(R.string.app_shell_admin_details_title))
                    appendLine("UID: ${document.uid}")
                    appendLine("Role: ${document.role}")
                    appendLine("canLogin: ${document.canLogin}")
                    append("canViewAdmin: true")
                }
                adminButton.visibility = View.VISIBLE
            } else {
                adminDetails.visibility = View.GONE
                adminButton.visibility = View.GONE
            }
        }

        findViewById<Button>(R.id.app_shell_open_public).setOnClickListener {
            startActivity(Intent(this, PublicHubActivity::class.java))
        }
        adminButton.setOnClickListener {
            startActivity(Intent(this, AdminDashboardActivity::class.java))
        }
        findViewById<Button>(R.id.app_shell_sign_out).setOnClickListener {
            authRepository.signOut()
            startActivity(Intent(this, AuthLoginActivity::class.java))
            finish()
        }
    }

    override fun onSupportNavigateUp(): Boolean {
        finish()
        return true
    }
}
