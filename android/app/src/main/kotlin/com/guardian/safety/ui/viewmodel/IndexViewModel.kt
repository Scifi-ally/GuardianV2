package com.guardian.safety.ui.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.google.android.gms.maps.model.LatLng
import com.guardian.safety.data.auth.AuthRepository
import com.guardian.safety.data.contacts.EmergencyContactRepository
import com.guardian.safety.data.location.LocationRepository
import com.guardian.safety.data.places.PlacesRepository
import com.guardian.safety.data.routing.RoutingRepository
import com.guardian.safety.data.model.EmergencyContact
import com.guardian.safety.data.model.EmergencyService
import com.guardian.safety.data.model.RouteDirection
import com.guardian.safety.data.model.SafeZone
import com.guardian.safety.data.model.UserProfile
import com.guardian.safety.services.EmergencyType
import com.guardian.safety.services.SOSService
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class IndexViewModel @Inject constructor(
    private val authRepository: AuthRepository,
    private val locationRepository: LocationRepository,
    private val emergencyContactRepository: EmergencyContactRepository,
    private val placesRepository: PlacesRepository,
    private val routingRepository: RoutingRepository,
    private val sosService: SOSService
) : ViewModel() {

    private val _uiState = MutableStateFlow(IndexUiState())
    val uiState: StateFlow<IndexUiState> = _uiState.asStateFlow()

    private val _userProfile = MutableStateFlow<UserProfile?>(null)
    val userProfile: StateFlow<UserProfile?> = _userProfile.asStateFlow()

    private val _userLocation = MutableStateFlow<LatLng?>(null)
    val userLocation: StateFlow<LatLng?> = _userLocation.asStateFlow()

    private val _emergencyContacts = MutableStateFlow<List<EmergencyContact>>(emptyList())
    val emergencyContacts: StateFlow<List<EmergencyContact>> = _emergencyContacts.asStateFlow()

    init {
        observeAuthState()
        observeLocation()
    }

    private fun observeAuthState() {
        viewModelScope.launch {
            authRepository.currentUser.collect { user ->
                if (user != null) {
                    val profile = authRepository.loadUserProfile(user.uid)
                    _userProfile.value = profile

                    // Load emergency contacts
                    emergencyContactRepository.getEmergencyContacts(user.uid).collect { contacts ->
                        _emergencyContacts.value = contacts
                    }
                } else {
                    _userProfile.value = null
                    _emergencyContacts.value = emptyList()
                }
            }
        }
    }

    private fun observeLocation() {
        viewModelScope.launch {
            locationRepository.getLocationUpdates().collect { location ->
                _userLocation.value = location

                // Load nearby emergency services and safe zones when location updates
                location?.let { userLoc ->
                    loadNearbyPlaces(userLoc)
                }
            }
        }
    }

    private fun loadNearbyPlaces(userLocation: LatLng) {
        viewModelScope.launch {
            try {
                // Load emergency services
                val emergencyServices = placesRepository.getNearbyEmergencyServices(userLocation)
                val safeZones = placesRepository.getNearbySafeZones(userLocation)

                _uiState.update { currentState ->
                    currentState.copy(
                        emergencyServices = emergencyServices,
                        safeZones = safeZones,
                        nearbyEmergencyServices = emergencyServices.map { it.location },
                        nearbySafeZones = safeZones.map { it.location }
                    )
                }
            } catch (e: Exception) {
                // Handle error - could show in UI state
                e.printStackTrace()
            }
        }
    }

    fun setFromLocation(location: String) {
        _uiState.update { it.copy(fromLocation = location) }
    }

    fun setToLocation(location: String) {
        _uiState.update { it.copy(toLocation = location) }
    }

    fun setTravelMode(mode: String) {
        _uiState.update { it.copy(travelMode = mode) }
    }

    fun startNavigation() {
        _uiState.update {
            it.copy(
                isNavigating = true,
                selectedTab = "navigation"
            )
        }
    }

    fun clearRoute() {
        _uiState.update {
            it.copy(
                isNavigating = false,
                fromLocation = "",
                toLocation = "",
                destination = null
            )
        }
    }

    fun setDestination(destination: LatLng) {
        _uiState.update { it.copy(destination = destination) }
    }

    fun setSelectedTab(tab: String) {
        _uiState.update { it.copy(selectedTab = tab) }
    }

    fun getCurrentLocation() {
        viewModelScope.launch {
            locationRepository.getCurrentLocation().collect { location ->
                location?.let { loc ->
                    _userLocation.value = loc
                    setFromLocation("${loc.latitude.toString().take(8)}, ${loc.longitude.toString().take(8)}")
                }
            }
        }
    }

    fun shareLocation() {
        viewModelScope.launch {
            val location = _userLocation.value
            val contacts = _emergencyContacts.value

            if (location != null && contacts.isNotEmpty()) {
                locationRepository.shareLocation(
                    location,
                    contacts.map { it.guardianKey }
                )
            }
        }
    }

    fun triggerSOS(emergencyType: EmergencyType = EmergencyType.GENERAL) {
        viewModelScope.launch {
            val profile = _userProfile.value
            val location = _userLocation.value

            if (profile != null) {
                _uiState.update { it.copy(sosActive = true) }

                sosService.triggerEmergency(profile, location, emergencyType).fold(
                    onSuccess = {
                        // SOS triggered successfully
                    },
                    onFailure = { error ->
                        _uiState.update { it.copy(sosActive = false) }
                        // Handle error
                    }
                )
            }
        }
    }

    fun cancelSOS() {
        viewModelScope.launch {
            val profile = _userProfile.value

            if (profile != null) {
                sosService.cancelEmergency(profile).fold(
                    onSuccess = {
                        _uiState.update { it.copy(sosActive = false) }
                    },
                    onFailure = { error ->
                        // Handle error
                    }
                )
            }
        }
    }
}

data class IndexUiState(
    val fromLocation: String = "",
    val toLocation: String = "",
    val travelMode: String = "WALKING",
    val isNavigating: Boolean = false,
    val selectedTab: String = "navigation",
    val destination: LatLng? = null,
    val sosActive: Boolean = false,
    val routeSettings: RouteSettings = RouteSettings(),
    val nearbyEmergencyServices: List<LatLng> = emptyList(),
    val nearbySafeZones: List<LatLng> = emptyList(),
    val emergencyServices: List<EmergencyService> = emptyList(),
    val safeZones: List<SafeZone> = emptyList(),
    val currentRoute: RouteDirection? = null,
    val routeSteps: List<String> = emptyList(),
    val routeSummary: String = ""
)

data class RouteSettings(
    val avoidTolls: Boolean = false,
    val avoidHighways: Boolean = false,
    val preferWellLit: Boolean = true,
    val avoidIsolated: Boolean = true,
    val showTraffic: Boolean = true,
    val showSafeZones: Boolean = true,
    val showEmergencyServices: Boolean = true
)
