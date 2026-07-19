/**
 * AuthLoginActivity.kt
 *
 * Purpose: Login screen — email/password and Google Sign-In entry point.
 * Connects to: AuthViewModel, AuthRepository, AuthRegisterActivity, MainActivity.
 * Notes: Launcher activity. Enforces canLogin after Firebase Auth succeeds.
 *        Google Sign-In requires auth_google_web_client_id (Web OAuth client from Firebase).
 */
package com.jdscott.pintpal.features.auth.ui

import android.content.Intent
import android.os.Bundle
import android.view.View
import android.widget.Toast
import androidx.activity.result.contract.ActivityResultContracts
import androidx.activity.viewModels
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.lifecycleScope
import com.google.android.gms.auth.api.signin.GoogleSignIn
import com.google.android.gms.auth.api.signin.GoogleSignInOptions
import com.google.android.gms.common.api.ApiException
import com.jdscott.pintpal.MainActivity
import com.jdscott.pintpal.R
import com.jdscott.pintpal.databinding.AuthLoginActivityBinding
import com.jdscott.pintpal.features.auth.data.AuthRepository
import kotlinx.coroutines.launch

class AuthLoginActivity : AppCompatActivity() {

    private lateinit var binding: AuthLoginActivityBinding
    private val viewModel: AuthViewModel by viewModels()
    private val authRepository = AuthRepository()

    private val googleSignInLauncher = registerForActivityResult(
        ActivityResultContracts.StartActivityForResult(),
    ) { result ->
        val task = GoogleSignIn.getSignedInAccountFromIntent(result.data)
        try {
            val account = task.getResult(ApiException::class.java)
            viewModel.signInWithGoogleIdToken(account.idToken)
        } catch (error: ApiException) {
            Toast.makeText(
                this,
                getString(R.string.auth_google_failed, error.statusCode.toString()),
                Toast.LENGTH_LONG,
            ).show()
        }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = AuthLoginActivityBinding.inflate(layoutInflater)
        setContentView(binding.root)

        lifecycleScope.launch {
            authRepository.loadCurrentUserDocument()
                .onSuccess { document ->
                    if (document != null) {
                        goToMain()
                    }
                }
        }

        binding.authLoginSubmit.setOnClickListener {
            viewModel.signIn(
                binding.authLoginEmail.text?.toString().orEmpty(),
                binding.authLoginPassword.text?.toString().orEmpty(),
            )
        }

        binding.authLoginGoogle.setOnClickListener { startGoogleSignIn() }

        binding.authLoginGoRegister.setOnClickListener {
            startActivity(Intent(this, AuthRegisterActivity::class.java))
        }

        viewModel.state.observe(this) { state ->
            when (state) {
                AuthUiState.Idle -> setLoading(false)
                AuthUiState.Loading -> setLoading(true)
                is AuthUiState.Success -> {
                    setLoading(false)
                    goToMain()
                }
                is AuthUiState.Error -> {
                    setLoading(false)
                    binding.authLoginError.visibility = View.VISIBLE
                    binding.authLoginError.text = state.message
                }
            }
        }
    }

    private fun startGoogleSignIn() {
        val webClientId = getString(R.string.auth_google_web_client_id)
        if (webClientId.isBlank()) {
            Toast.makeText(this, R.string.auth_google_not_configured, Toast.LENGTH_LONG).show()
            return
        }
        val options = GoogleSignInOptions.Builder(GoogleSignInOptions.DEFAULT_SIGN_IN)
            .requestIdToken(webClientId)
            .requestEmail()
            .build()
        val client = GoogleSignIn.getClient(this, options)
        googleSignInLauncher.launch(client.signInIntent)
    }

    private fun setLoading(loading: Boolean) {
        binding.authLoginProgress.visibility = if (loading) View.VISIBLE else View.GONE
        binding.authLoginSubmit.isEnabled = !loading
        binding.authLoginGoogle.isEnabled = !loading
    }

    private fun goToMain() {
        startActivity(Intent(this, MainActivity::class.java))
        finish()
    }
}
