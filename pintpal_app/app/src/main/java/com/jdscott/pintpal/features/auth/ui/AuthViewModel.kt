/**
 * AuthViewModel.kt
 *
 * Purpose: UI state holder for login and registration screens.
 * Connects to: AuthRepository (features/auth/data). Used by AuthLoginActivity and AuthRegisterActivity.
 * Notes: Exposes LiveData AuthUiState. Google sign-in ID token is obtained in the Activity
 *        via Google Sign-In SDK, then passed to signInWithGoogleIdToken.
 */
package com.jdscott.pintpal.features.auth.ui

import androidx.lifecycle.LiveData
import androidx.lifecycle.MutableLiveData
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.jdscott.pintpal.features.auth.data.AuthRepository
import com.jdscott.pintpal.features.auth.domain.UserDocument
import kotlinx.coroutines.launch

sealed class AuthUiState {
    data object Idle : AuthUiState()
    data object Loading : AuthUiState()
    data class Success(val document: UserDocument) : AuthUiState()
    data class Error(val message: String) : AuthUiState()
}

class AuthViewModel : ViewModel() {

    private val repository = AuthRepository()

    private val _state = MutableLiveData<AuthUiState>(AuthUiState.Idle)
    val state: LiveData<AuthUiState> = _state

    fun register(name: String, email: String, password: String) {
        if (name.isBlank() || email.isBlank() || password.length < 6) {
            _state.value = AuthUiState.Error("Enter a name, email, and password (min 6 characters).")
            return
        }
        viewModelScope.launch {
            _state.value = AuthUiState.Loading
            repository.registerWithEmail(name, email, password)
                .onSuccess { _state.value = AuthUiState.Success(it) }
                .onFailure { _state.value = AuthUiState.Error(it.message ?: "Registration failed.") }
        }
    }

    fun signIn(email: String, password: String) {
        if (email.isBlank() || password.isBlank()) {
            _state.value = AuthUiState.Error("Enter email and password.")
            return
        }
        viewModelScope.launch {
            _state.value = AuthUiState.Loading
            repository.signInWithEmail(email, password)
                .onSuccess { _state.value = AuthUiState.Success(it) }
                .onFailure { _state.value = AuthUiState.Error(it.message ?: "Sign-in failed.") }
        }
    }

    fun signInWithGoogleIdToken(idToken: String?) {
        if (idToken.isNullOrBlank()) {
            _state.value = AuthUiState.Error(
                "Google Sign-In is not configured. Add your Web client ID to auth_google_web_client_id and enable Google in Firebase Auth.",
            )
            return
        }
        viewModelScope.launch {
            _state.value = AuthUiState.Loading
            repository.signInWithGoogleIdToken(idToken)
                .onSuccess { _state.value = AuthUiState.Success(it) }
                .onFailure { _state.value = AuthUiState.Error(it.message ?: "Google sign-in failed.") }
        }
    }

    fun clearError() {
        if (_state.value is AuthUiState.Error) {
            _state.value = AuthUiState.Idle
        }
    }
}
