/**
 * AuthRegisterActivity.kt
 *
 * Purpose: Registration screen — creates Firebase Auth user and matching Firestore users doc.
 * Connects to: AuthViewModel, AuthRepository, AuthLoginActivity, MainActivity.
 * Notes: Writes email, name, role="user", canLogin=true, canViewAdmin=false only.
 */
package com.jdscott.pintpal.features.auth.ui

import android.content.Intent
import android.os.Bundle
import android.view.View
import androidx.activity.viewModels
import androidx.appcompat.app.AppCompatActivity
import com.jdscott.pintpal.MainActivity
import com.jdscott.pintpal.databinding.AuthRegisterActivityBinding

class AuthRegisterActivity : AppCompatActivity() {

    private lateinit var binding: AuthRegisterActivityBinding
    private val viewModel: AuthViewModel by viewModels()

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = AuthRegisterActivityBinding.inflate(layoutInflater)
        setContentView(binding.root)

        binding.authRegisterSubmit.setOnClickListener {
            viewModel.register(
                binding.authRegisterName.text?.toString().orEmpty(),
                binding.authRegisterEmail.text?.toString().orEmpty(),
                binding.authRegisterPassword.text?.toString().orEmpty(),
            )
        }

        binding.authRegisterGoLogin.setOnClickListener {
            finish()
        }

        viewModel.state.observe(this) { state ->
            when (state) {
                AuthUiState.Idle -> setLoading(false)
                AuthUiState.Loading -> setLoading(true)
                is AuthUiState.Success -> {
                    setLoading(false)
                    startActivity(
                        Intent(this, MainActivity::class.java).apply {
                            flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TASK
                        },
                    )
                    finish()
                }
                is AuthUiState.Error -> {
                    setLoading(false)
                    binding.authRegisterError.visibility = View.VISIBLE
                    binding.authRegisterError.text = state.message
                }
            }
        }
    }

    private fun setLoading(loading: Boolean) {
        binding.authRegisterProgress.visibility = if (loading) View.VISIBLE else View.GONE
        binding.authRegisterSubmit.isEnabled = !loading
    }
}
