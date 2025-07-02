package com.guardian.safety.ui.components

import androidx.compose.foundation.layout.*
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.unit.dp
import com.google.android.gms.maps.CameraUpdateFactory
import com.google.android.gms.maps.model.*
import com.google.maps.android.compose.*
import com.guardian.safety.ui.theme.*

@Composable
fun RealGoogleMap(
    modifier: Modifier = Modifier,
    userLocation: LatLng?,
    destination: LatLng?,
    travelMode: String = "WALKING",
    isNavigating: Boolean = false,
    onMapClick: (LatLng) -> Unit = {},
    emergencyServices: List<LatLng> = emptyList(),
    safeZones: List<LatLng> = emptyList(),
    mapTheme: String = "light", // Match web app: "light" | "dark"
    mapType: String = "normal", // Match web app: "normal" | "satellite"
    showTraffic: Boolean = true,
    showSafeZones: Boolean = true,
    showEmergencyServices: Boolean = true,
    enableSatelliteView: Boolean = false,
    zoomLevel: Float = 15f,
    trackUserLocation: Boolean = true
) {
    val context = LocalContext.current

    // Default location (San Francisco) matching web app
    val defaultLocation = LatLng(37.7749, -122.4194)
    val mapCenter = userLocation ?: defaultLocation

    val cameraPositionState = rememberCameraPositionState {
        position = CameraPosition.fromLatLngZoom(mapCenter, zoomLevel)
    }

    // Update camera when user location changes (matching web app behavior)
    LaunchedEffect(userLocation) {
        userLocation?.let { location ->
            if (trackUserLocation) {
                cameraPositionState.animate(
                    CameraUpdateFactory.newLatLngZoom(location, zoomLevel)
                )
            }
        }
    }

    // Map properties matching web app configuration
    val actualMapType = when (mapType) {
        "satellite" -> MapType.SATELLITE
        "hybrid" -> MapType.HYBRID
        "terrain" -> MapType.TERRAIN
        else -> MapType.NORMAL
    }

    val mapProperties = MapProperties(
        isMyLocationEnabled = userLocation != null && trackUserLocation,
        mapType = if (enableSatelliteView) MapType.SATELLITE else actualMapType,
        isTrafficEnabled = showTraffic,
        // Add dark theme support matching web app
        mapStyleOptions = if (mapTheme == "dark") {
            MapStyleOptions.loadRawResourceStyle(context, android.R.raw.dark_map_style)
        } else null
    )

    val mapUiSettings = MapUiSettings(
        myLocationButtonEnabled = true,
        zoomControlsEnabled = false,
        compassEnabled = true,
        mapToolbarEnabled = false
    )

    GoogleMap(
        modifier = modifier,
        cameraPositionState = cameraPositionState,
        properties = mapProperties,
        uiSettings = mapUiSettings,
        onMapClick = onMapClick
    ) {
        // User location marker
        userLocation?.let { location ->
            Marker(
                state = MarkerState(position = location),
                title = "Your Location",
                icon = BitmapDescriptorFactory.defaultMarker(BitmapDescriptorFactory.HUE_BLUE)
            )
        }

        // Destination marker
        destination?.let { dest ->
            Marker(
                state = MarkerState(position = dest),
                title = "Destination",
                icon = BitmapDescriptorFactory.defaultMarker(BitmapDescriptorFactory.HUE_RED)
            )
        }

        // Route polyline matching web app styling
        if (isNavigating && userLocation != null && destination != null) {
            Polyline(
                points = listOf(userLocation, destination),
                color = MaterialTheme.colorScheme.primary, // Use theme primary (black)
                width = 8f,
                pattern = listOf(
                    Dash(20f), Gap(10f) // Dashed line like web app
                )
            )
        }

        // Emergency services markers (only if enabled)
        if (showEmergencyServices) {
            emergencyServices.forEach { location ->
                Marker(
                    state = MarkerState(position = location),
                    title = "Emergency Service",
                    icon = BitmapDescriptorFactory.defaultMarker(BitmapDescriptorFactory.HUE_RED),
                    snippet = "Hospital/Police Station"
                )
            }
        }

        // Safe zones (circles) - only if enabled, matching web app
        if (showSafeZones) {
            safeZones.forEach { location ->
                Circle(
                    center = location,
                    radius = 200.0, // 200 meters
                    fillColor = SafeColor.copy(alpha = 0.2f),
                    strokeColor = SafeColor,
                    strokeWidth = 2f
                )

                // Add marker for safe zone center
                Marker(
                    state = MarkerState(position = location),
                    title = "Safe Zone",
                    icon = BitmapDescriptorFactory.defaultMarker(BitmapDescriptorFactory.HUE_GREEN),
                    snippet = "Safe area - 200m radius"
                )
            }
        }
    }
}

@Composable
fun MapControls(
    modifier: Modifier = Modifier,
    onMyLocationClick: () -> Unit,
    onMapTypeToggle: () -> Unit
) {
    Column(
        modifier = modifier,
        verticalArrangement = Arrangement.spacedBy(8.dp)
    ) {
        FloatingActionButton(
            onClick = onMyLocationClick,
            modifier = Modifier.size(48.dp),
            containerColor = MaterialTheme.colorScheme.surface,
            contentColor = GuardianBlue
        ) {
            Icon(
                imageVector = Icons.Default.MyLocation,
                contentDescription = "My Location"
            )
        }

        FloatingActionButton(
            onClick = onMapTypeToggle,
            modifier = Modifier.size(48.dp),
            containerColor = MaterialTheme.colorScheme.surface,
            contentColor = GuardianBlue
        ) {
            Icon(
                imageVector = Icons.Default.Layers,
                contentDescription = "Map Type"
            )
        }
    }
}
