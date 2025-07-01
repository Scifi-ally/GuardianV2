package com.guardian.safety.presentation.viewmodels

import android.content.Context
import android.content.Intent
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.guardian.safety.data.models.SOSAlert
import com.guardian.safety.data.repositories.SOSRepository
import com.guardian.safety.services.SOSAlertService
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class SOSViewModel @Inject constructor(
    private val sosRepository: SOSRepository
) : ViewModel() {

    private val _uiState = MutableStateFlow(SOSUiState())
    val uiState: StateFlow<SOSUiState> = _uiState.asStateFlow()

    private val _receivedAlerts = MutableStateFlow<List<SOSAlert>>(emptyList())
    val receivedAlerts: StateFlow<List<SOSAlert>> = _receivedAlerts.asStateFlow()

    private val _sentAlerts = MutableStateFlow<List<SOSAlert>>(emptyList())
    val sentAlerts: StateFlow<List<SOSAlert>> = _sentAlerts.asStateFlow()

    fun startSOSCountdown(context: Context, message: String = "Emergency! I need help!") {
        _uiState.value = _uiState.value.copy(isSOSActive = true, countdown = 3)
        
        // Start countdown
        viewModelScope.launch {
            for (i in 3 downTo 1) {
                _uiState.value = _uiState.value.copy(countdown = i)
                kotlinx.coroutines.delay(1000)
            }
            
            // Send SOS alert
            sendSOSAlert(context, message)
        }
    }

    fun cancelSOS() {
        _uiState.value = _uiState.value.copy(isSOSActive = false, countdown = 0)
    }

    private fun sendSOSAlert(context: Context, message: String) {
        val intent = Intent(context, SOSAlertService::class.java).apply {
            action = SOSAlertService.ACTION_SEND_SOS
            putExtra(SOSAlertService.EXTRA_MESSAGE, message)
        }
        context.startService(intent)
        
        _uiState.value = _uiState.value.copy(
            isSOSActive = false,
            countdown = 0,
            lastSOSSent = System.currentTimeMillis()
        )
    }

    fun loadReceivedAlerts(userId: String) {
        viewModelScope.launch {
            sosRepository.getSOSAlertsForUser(userId).collect { alerts ->
                _receivedAlerts.value = alerts
            }
        }
    }

    fun loadSentAlerts(userId: String) {
        viewModelScope.launch {
            sosRepository.getUserSentAlerts(userId).collect { alerts ->
                _sentAlerts.value = alerts
            }
        }
    }

    fun acknowledgeAlert(alertId: String, userId: String) {
        viewModelScope.launch {
            sosRepository.acknowledgeSOSAlert(alertId, userId)
        }
    }

    fun resolveAlert(alertId: String) {
        viewModelScope.launch {
            sosRepository.resolveSOSAlert(alertId)
        }
    }
}

data class SOSUiState(
    val isSOSActive: Boolean = false,
    val countdown: Int = 0,
    val lastSOSSent: Long? = null,
    val isLoading: Boolean = false,
    val errorMessage: String? = null
)
