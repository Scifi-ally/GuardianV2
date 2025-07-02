package com.guardian.safety.services

import android.Manifest
import android.content.Context
import android.content.pm.PackageManager
import android.location.Location
import android.location.LocationListener
import android.location.LocationManager
import android.os.Bundle
import androidx.core.content.ContextCompat
import com.guardian.safety.ui.components.LocationData
import dagger.hilt.android.qualifiers.ApplicationContext
import kotlinx.coroutines.*
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class RealTimeLocationService @Inject constructor(
    @ApplicationContext private val context: Context
) {
    private val locationManager = context.getSystemService(Context.LOCATION_SERVICE) as LocationManager
    private val scope = CoroutineScope(Dispatchers.IO + SupervisorJob())
    
    private val _currentLocation = MutableStateFlow<LocationData?>(null)
    val currentLocation: StateFlow<LocationData?> = _currentLocation
    
    private val _isTracking = MutableStateFlow(false)
    val isTracking: StateFlow<Boolean> = _isTracking
    
    private var locationListener: LocationListener? = null
    private var trackingJob: Job? = null
    
    fun startTracking(
        userId: String,
        onLocationUpdate: (LocationData) -> Unit,
        onError: (Exception) -> Unit,
        options: TrackingOptions = TrackingOptions()
    ): () -> Unit {
        
        if (!hasLocationPermission()) {
            onError(SecurityException("Location permission not granted"))
            return { }
        }
        
        stopTracking() // Stop any existing tracking
        
        _isTracking.value = true
        
        locationListener = object : LocationListener {
            override fun onLocationChanged(location: Location) {
                val locationData = LocationData(
                    latitude = location.latitude,
                    longitude = location.longitude,
                    accuracy = location.accuracy,
                    timestamp = location.time
                )
                
                _currentLocation.value = locationData
                onLocationUpdate(locationData)
            }
            
            override fun onStatusChanged(provider: String?, status: Int, extras: Bundle?) {}
            override fun onProviderEnabled(provider: String) {}
            override fun onProviderDisabled(provider: String) {
                onError(Exception("Location provider disabled: $provider"))
            }
        }
        
        try {
            // Request location updates
            locationManager.requestLocationUpdates(
                LocationManager.GPS_PROVIDER,
                options.interval,
                0f, // minimum distance
                locationListener!!
            )
            
            // Also try network provider as fallback
            if (locationManager.isProviderEnabled(LocationManager.NETWORK_PROVIDER)) {
                locationManager.requestLocationUpdates(
                    LocationManager.NETWORK_PROVIDER,
                    options.interval,
                    0f,
                    locationListener!!
                )
            }
            
            // Start periodic updates for emergency mode
            if (options.emergencyMode) {
                trackingJob = scope.launch {
                    while (isActive && _isTracking.value) {
                        try {
                            getCurrentLocation()?.let { location ->
                                val locationData = LocationData(
                                    latitude = location.latitude,
                                    longitude = location.longitude,
                                    accuracy = location.accuracy,
                                    timestamp = System.currentTimeMillis()
                                )
                                onLocationUpdate(locationData)
                            }
                        } catch (e: Exception) {
                            if (!options.silentUpdates) {
                                onError(e)
                            }
                        }
                        delay(options.interval)
                    }
                }
            }
            
        } catch (e: SecurityException) {
            onError(e)
        } catch (e: Exception) {
            onError(e)
        }
        
        // Return stop function
        return { stopTracking() }
    }
    
    fun stopTracking() {
        _isTracking.value = false
        trackingJob?.cancel()
        locationListener?.let {
            locationManager.removeUpdates(it)
        }
        locationListener = null
    }
    
    suspend fun getCurrentLocation(): Location? = withContext(Dispatchers.IO) {
        if (!hasLocationPermission()) {
            return@withContext null
        }
        
        try {
            val providers = listOf(
                LocationManager.GPS_PROVIDER,
                LocationManager.NETWORK_PROVIDER,
                LocationManager.PASSIVE_PROVIDER
            )
            
            for (provider in providers) {
                if (locationManager.isProviderEnabled(provider)) {
                    val location = locationManager.getLastKnownLocation(provider)
                    if (location != null) {
                        return@withContext location
                    }
                }
            }
        } catch (e: SecurityException) {
            // Permission not granted
        } catch (e: Exception) {
            // Other error
        }
        
        return@withContext null
    }
    
    private fun hasLocationPermission(): Boolean {
        return ContextCompat.checkSelfPermission(
            context,
            Manifest.permission.ACCESS_FINE_LOCATION
        ) == PackageManager.PERMISSION_GRANTED ||
        ContextCompat.checkSelfPermission(
            context,
            Manifest.permission.ACCESS_COARSE_LOCATION
        ) == PackageManager.PERMISSION_GRANTED
    }
    
    fun getLocationAccuracy(): Float? {
        return _currentLocation.value?.accuracy
    }
    
    fun getLastKnownLocation(): LocationData? {
        return _currentLocation.value
    }
    
    fun isLocationServicesEnabled(): Boolean {
        return locationManager.isProviderEnabled(LocationManager.GPS_PROVIDER) ||
               locationManager.isProviderEnabled(LocationManager.NETWORK_PROVIDER)
    }
}

data class TrackingOptions(
    val interval: Long = 30000, // 30 seconds
    val silentUpdates: Boolean = true,
    val emergencyMode: Boolean = false,
    val highAccuracy: Boolean = true
)

// Extension functions for easier usage
fun RealTimeLocationService.startEmergencyTracking(
    userId: String,
    onLocationUpdate: (LocationData) -> Unit,
    onError: (Exception) -> Unit = {}
): () -> Unit {
    return startTracking(
        userId = userId,
        onLocationUpdate = onLocationUpdate,
        onError = onError,
        options = TrackingOptions(
            interval = 10000, // 10 seconds for emergency
            emergencyMode = true,
            silentUpdates = false
        )
    )
}

fun RealTimeLocationService.startBackgroundTracking(
    userId: String,
    onLocationUpdate: (LocationData) -> Unit,
    onError: (Exception) -> Unit = {}
): () -> Unit {
    return startTracking(
        userId = userId,
        onLocationUpdate = onLocationUpdate,
        onError = onError,
        options = TrackingOptions(
            interval = 60000, // 1 minute for background
            emergencyMode = false,
            silentUpdates = true
        )
    )
}
