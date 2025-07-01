package com.guardian.safety.presentation.viewmodels

import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.google.firebase.auth.FirebaseUser
import com.guardian.safety.data.models.User
import com.guardian.safety.data.repositories.AuthRepository
import com.guardian.safety.data.repositories.EmergencyContactsRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class AuthViewModel @Inject constructor(
    private val authRepository: AuthRepository,
    private val emergencyContactsRepository: EmergencyContactsRepository
) : ViewModel() {

    private val _uiState = MutableStateFlow(AuthUiState())
    val uiState: StateFlow<AuthUiState> = _uiState.asStateFlow()

    private val _currentUser = MutableStateFlow<FirebaseUser?>(null)
    val currentUser: StateFlow<FirebaseUser?> = _currentUser.asStateFlow()

    private val _userProfile = MutableStateFlow<User?>(null)
    val userProfile: StateFlow<User?> = _userProfile.asStateFlow()

    var isAuthenticated by mutableStateOf(false)
        private set

    init {
        observeAuthState()
        isAuthenticated = authRepository.isUserAuthenticated()
    }

    private fun observeAuthState() {
        viewModelScope.launch {
            authRepository.currentUser.collect { user ->
                _currentUser.value = user
                isAuthenticated = user != null
                
                if (user != null) {
                    loadUserProfile()
                } else {
                    _userProfile.value = null
                }
            }
        }
    }

    fun signIn(email: String, password: String) {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isLoading = true, errorMessage = null)
            
            val result = authRepository.signInWithEmailAndPassword(email, password)
            if (result.isSuccess) {
                loadUserProfile()
            } else {
                _uiState.value = _uiState.value.copy(
                    isLoading = false,
                    errorMessage = result.exceptionOrNull()?.message ?: "Sign in failed"
                )
            }
        }
    }

    fun signUp(email: String, password: String, displayName: String) {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isLoading = true, errorMessage = null)
            
            val result = authRepository.createUserWithEmailAndPassword(email, password)
            if (result.isSuccess) {
                val user = result.getOrNull()!!
                
                // Generate guardian key
                val keyResult = emergencyContactsRepository.generateGuardianKey(user.uid)
                val guardianKey = keyResult.getOrNull() ?: ""
                
                // Create user profile
                val userProfile = User(
                    uid = user.uid,
                    email = email,
                    displayName = displayName,
                    guardianKey = guardianKey,
                    createdAt = System.currentTimeMillis(),
                    lastSeen = System.currentTimeMillis()
                )
                
                val profileResult = authRepository.createUserProfile(userProfile)
                if (profileResult.isSuccess) {
                    _userProfile.value = userProfile
                    _uiState.value = _uiState.value.copy(isLoading = false)
                } else {
                    _uiState.value = _uiState.value.copy(
                        isLoading = false,
                        errorMessage = "Failed to create user profile"
                    )
                }
            } else {
                _uiState.value = _uiState.value.copy(
                    isLoading = false,
                    errorMessage = result.exceptionOrNull()?.message ?: "Sign up failed"
                )
            }
        }
    }

    fun signOut() {
        viewModelScope.launch {
            authRepository.signOut()
        }
    }

    private fun loadUserProfile() {
        viewModelScope.launch {
            val result = authRepository.getCurrentUserProfile()
            if (result.isSuccess) {
                _userProfile.value = result.getOrNull()
                _uiState.value = _uiState.value.copy(isLoading = false)
            } else {
                _uiState.value = _uiState.value.copy(
                    isLoading = false,
                    errorMessage = "Failed to load user profile"
                )
            }
        }
    }

    fun updateUserProfile(user: User) {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isLoading = true)
            
            val result = authRepository.updateUserProfile(user)
            if (result.isSuccess) {
                _userProfile.value = user
                _uiState.value = _uiState.value.copy(isLoading = false)
            } else {
                _uiState.value = _uiState.value.copy(
                    isLoading = false,
                    errorMessage = "Failed to update profile"
                )
            }
        }
    }

    fun clearError() {
        _uiState.value = _uiState.value.copy(errorMessage = null)
    }
}

data class AuthUiState(
    val isLoading: Boolean = false,
    val errorMessage: String? = null
)
