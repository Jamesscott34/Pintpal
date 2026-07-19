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
import com.google.android.material.snackbar.Snackbar
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
import com.jdscott.pintpal.features.auth.data.AuthRepository
import com.jdscott.pintpal.features.auth.ui.AuthLoginActivity
import kotlinx.coroutines.launch

class MainActivity : AppCompatActivity() {

    private lateinit var appBarConfiguration: AppBarConfiguration
    private lateinit var binding: ActivityMainBinding
    private val authRepository = AuthRepository()

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
            setupUi(document.name.ifBlank { document.email })
        }
    }

    private fun setupUi(displayName: String) {
        binding = ActivityMainBinding.inflate(layoutInflater)
        setContentView(binding.root)
        setSupportActionBar(binding.appBarMain.toolbar)

        binding.appBarMain.fab?.setOnClickListener { view ->
            Snackbar.make(view, getString(R.string.auth_signed_in_as, displayName), Snackbar.LENGTH_LONG)
                .setAction(R.string.auth_sign_out) {
                    authRepository.signOut()
                    startActivity(Intent(this, AuthLoginActivity::class.java))
                    finish()
                }
                .setAnchorView(R.id.fab).show()
        }

        val navHostFragment =
            (supportFragmentManager.findFragmentById(R.id.nav_host_fragment_content_main) as NavHostFragment?)!!
        val navController = navHostFragment.navController

        binding.navView?.let {
            appBarConfiguration = AppBarConfiguration(
                setOf(
                    R.id.nav_transform, R.id.nav_reflow, R.id.nav_slideshow, R.id.nav_settings
                ),
                binding.drawerLayout
            )
            setupActionBarWithNavController(navController, appBarConfiguration)
            it.setupWithNavController(navController)
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
        // Using findViewById because NavigationView exists in different layout files
        // between w600dp and w1240dp
        val navView: NavigationView? = findViewById(R.id.nav_view)
        if (navView == null) {
            // The navigation drawer already has the items including the items in the overflow menu
            // We only inflate the overflow menu if the navigation drawer isn't visible
            menuInflater.inflate(R.menu.overflow, menu)
        }
        menu.add(0, MENU_SIGN_OUT, 0, R.string.auth_sign_out)
        return result
    }

    override fun onOptionsItemSelected(item: MenuItem): Boolean {
        when (item.itemId) {
            R.id.nav_settings -> {
                val navController = findNavController(R.id.nav_host_fragment_content_main)
                navController.navigate(R.id.nav_settings)
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
    }
}
