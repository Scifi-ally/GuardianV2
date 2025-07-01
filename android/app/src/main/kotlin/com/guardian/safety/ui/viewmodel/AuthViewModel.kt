package com.guardian.safety.ui.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.guardian.safety.data.auth.AuthRepository
import com.guardian.safety.data.model.UserProfile
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class AuthViewModel @Inject constructor(
    private val authRepository: AuthRepository
) : ViewModel() {

    private val _authState = MutableStateFlow<AuthState>(AuthState.Loading)
    val authState: StateFlow<AuthState> = _authState.asStateFlow()

    private val _userProfile = MutableStateFlow<UserProfile?>(null)
    val userProfile: StateFlow<UserProfile?> = _userProfile.asStateFlow()

    init {
        observeAuthState()
    }

    private fun observeAuthState() {
        viewModelScope.launch {
            authRepository.currentUser.collect { user ->
                if (user != null) {
                    try {
                        val profile = authRepository.loadUserProfile(user.uid)
                        _userProfile.value = profile
                        _authState.value = AuthState.Authenticated(profile)
                    } catch (e: Exception) {
                        _authState.value = AuthState.Error(e.message ?: "Unknown error")
                    }
                } else {
                    _userProfile.value = null
                    _authState.value = AuthState.Unauthenticated
                }
            }
        }
    }

    fun signIn(email: String, password: String) {
        viewModelScope.launch {
            _authState.value = AuthState.Loading
            
            val result = authRepository.signIn(email, password)
            result.fold(
                onSuccess = { profile ->
                    _userProfile.value = profile
                    _authState.value = AuthState.Authenticated(profile)
                },
                onFailure = { error ->
                    _authState.value = AuthState.Error(
                        when {
                            error.message?.contains("user-not-found") == true -> 
                                "No account found with this email. Please sign up first."
                            error.message?.contains("wrong-password") == true -> 
                                "Incorrect password. Please try again."
                            error.message?.contains("invalid-email") == true -> 
                                "Please enter a valid email address."
                            error.message?.contains("user-disabled") == true -> 
                                "This account has been disabled. Please contact support."
                            error.message?.contains("too-many-requests") == true -> 
                                "Too many failed attempts. Please try again later."
                            else -> "Failed to sign in. Please check your credentials."
                        }
                    )
                }
            )
        }
    }

    fun signUp(email: String, password: String, name: String) {
        viewModelScope.launch {
            _authState.value = AuthState.Loading
            
            val result = authRepository.signUp(email, password, name)
            result.fold(
                onSuccess = { profile ->
                    _userProfile.value = profile
                    _authState.value = AuthState.Authenticated(profile)
                },
                onFailure = { error ->
                    _authState.value = AuthState.Error(
                        when {
                            error.message?.contains("email-already-in-use") == true -> 
                                "An account with this email already exists."
                            error.message?.contains("weak-password") == true -> 
                                "Password is too weak. Please choose a stronger password."
                            error.message?.contains("invalid-email") == true -> 
                                "Please enter a valid email address."
                            else -> "Failed to create account. Please try again."
                        }
                    )
                }
            )
        }
    }

    fun signOut() {
        viewModelScope.launch {
            authRepository.signOut()
        }
    }

    fun updateProfile(profile: UserProfile) {
        viewModelScope.launch {
            authRepository.updateProfile(profile).fold(
                onSuccess = {
                    _userProfile.value = profile
                },
                onFailure = { error ->
                    _authState.value = AuthState.Error(error.message ?: "Failed to update profile")
                }
            )
        }
    }

    fun clearError() {
        viewModelScope.launch {
            if (_authState.value is AuthState.Error) {
                _authState.value = AuthState.Unauthenticated
            }
        }
    }
}

sealed class AuthState {
    object Loading : AuthState()
    object Unauthenticated : AuthState()
    data class Authenticated(val user: UserProfile) : AuthState()
    data class Error(val message: String) : AuthState()
}
