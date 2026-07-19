/**
 * MainActivity.kt
 *
 * Purpose: Post-login host activity (existing navigation drawer shell).
 * Connects to: AuthLoginActivity when the user is signed out or canLogin is false.
 * Notes: Stage 1 only gates entry; feature screens arrive in later stages.
 */
package com.jdscott.pintpal

import android.content.Intent
import android.os.Bundle
import android.view.Menu
import android.view.MenuItem
import com.google.android.material.navigation.NavigationView
import androidx.lifecycle.lifecycleScope
import androidx.navigation.findNavController
import androidx.navigation.fragment.NavHostFragment
import androidx.navigation.ui.AppBarConfiguration
import androidx.navigation.ui.navigateUp
import androidx.navigation.ui.setupActionBarWithNavController
import androidx.navigation.ui.setupWithNavController
import androidx.appcompat.app.AppCompatActivity
import com.jdscott.pintpal.databinding.ActivityMainBinding
import com.jdscott.pintpal.features.admin.ui.AdminDashboardActivity
import com.jdscott.pintpal.features.app_shell.ui.PrivateProfileActivity
import com.jdscott.pintpal.features.app_shell.ui.PublicHubActivity
import com.jdscott.pintpal.features.auth.data.AuthRepository
import com.jdscott.pintpal.features.auth.domain.UserDocument
import com.jdscott.pintpal.features.auth.ui.AuthLoginActivity
import com.jdscott.pintpal.utilities.UserPermissions
import kotlinx.coroutines.launch

class MainActivity : AppCompatActivity() {

    private lateinit var appBarConfiguration: AppBarConfiguration
    private lateinit var binding: ActivityMainBinding
    private val authRepository = AuthRepository()
    private var isAdminUser: Boolean = false

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        lifecycleScope.launch {
            val documentResult = authRepository.loadCurrentUserDocument()
            val document = documentResult.getOrNull()
            if (document == null) {
                startActivity(Intent(this@MainActivity, AuthLoginActivity::class.java))
                finish()
                return@launch
            }
            isAdminUser = UserPermissions.canViewAdmin(document.toPermissionFlags())
            setupUi(document)
        }
    }

    private fun setupUi(document: UserDocument) {
        val displayName = document.name.ifBlank { document.email }
        val email = document.email
        val flags = document.toPermissionFlags()
        val subscriptionLine = if (UserPermissions.isSubscriptionPaid(flags)) {
            getString(R.string.auth_subscription_paid)
        } else {
            getString(
                R.string.auth_subscription_free,
                UserPermissions.remainingPhotoUploadsToday(flags),
            )
        }

        binding = ActivityMainBinding.inflate(layoutInflater)
        setContentView(binding.root)
        setSupportActionBar(binding.appBarMain.toolbar)

        // FAB opens Public section (games & chats).
        binding.appBarMain.fab?.setOnClickListener {
            startActivity(Intent(this, PublicHubActivity::class.java))
        }

        val navHostFragment =
            (supportFragmentManager.findFragmentById(R.id.nav_host_fragment_content_main) as NavHostFragment?)!!
        val navController = navHostFragment.navController

        binding.navView?.let { navView ->
            appBarConfiguration = AppBarConfiguration(
                setOf(
                    R.id.nav_transform, R.id.nav_reflow, R.id.nav_slideshow, R.id.nav_settings
                ),
                binding.drawerLayout
            )
            setupActionBarWithNavController(navController, appBarConfiguration)
            navView.setupWithNavController(navController)

            val header = navView.getHeaderView(0)
            header.findViewById<android.widget.TextView>(R.id.textView)?.text =
                getString(
                    R.string.nav_header_user_line,
                    email.ifBlank { displayName },
                    subscriptionLine,
                )
        }

        binding.appBarMain.contentMain.bottomNavView?.let {
            appBarConfiguration = AppBarConfiguration(
                setOf(
                    R.id.nav_transform, R.id.nav_reflow, R.id.nav_slideshow
                )
            )
            setupActionBarWithNavController(navController, appBarConfiguration)
            it.setupWithNavController(navController)
        }
    }

    override fun onCreateOptionsMenu(menu: Menu): Boolean {
        if (!::binding.isInitialized) return false
        val result = super.onCreateOptionsMenu(menu)
        val navView: NavigationView? = findViewById(R.id.nav_view)
        if (navView == null) {
            menuInflater.inflate(R.menu.overflow, menu)
        }
        menu.add(0, MENU_PUBLIC, 0, R.string.menu_public)
        menu.add(0, MENU_PRIVATE, 1, R.string.menu_private)
        if (isAdminUser) {
            menu.add(0, MENU_ADMIN, 2, R.string.menu_admin)
        }
        menu.add(0, MENU_SIGN_OUT, 3, R.string.auth_sign_out)
        return result
    }

    override fun onOptionsItemSelected(item: MenuItem): Boolean {
        when (item.itemId) {
            R.id.nav_settings -> {
                val navController = findNavController(R.id.nav_host_fragment_content_main)
                navController.navigate(R.id.nav_settings)
            }
            MENU_PUBLIC -> {
                startActivity(Intent(this, PublicHubActivity::class.java))
                return true
            }
            MENU_PRIVATE -> {
                startActivity(Intent(this, PrivateProfileActivity::class.java))
                return true
            }
            MENU_ADMIN -> {
                startActivity(Intent(this, AdminDashboardActivity::class.java))
                return true
            }
            MENU_SIGN_OUT -> {
                authRepository.signOut()
                startActivity(Intent(this, AuthLoginActivity::class.java))
                finish()
                return true
            }
        }
        return super.onOptionsItemSelected(item)
    }

    override fun onSupportNavigateUp(): Boolean {
        if (!::binding.isInitialized) return super.onSupportNavigateUp()
        val navController = findNavController(R.id.nav_host_fragment_content_main)
        return navController.navigateUp(appBarConfiguration) || super.onSupportNavigateUp()
    }

    companion object {
        private const val MENU_SIGN_OUT = 1001
        private const val MENU_PUBLIC = 1002
        private const val MENU_PRIVATE = 1003
        private const val MENU_ADMIN = 1004
    }
}
