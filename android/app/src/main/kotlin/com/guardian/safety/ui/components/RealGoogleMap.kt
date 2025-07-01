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
    travelMode: String,
    isNavigating: Boolean,
    onMapClick: (LatLng) -> Unit = {},
    emergencyServices: List<LatLng> = emptyList(),
    safeZones: List<LatLng> = emptyList()
) {
    val context = LocalContext.current

    // Default location (San Francisco) if no user location
    val defaultLocation = LatLng(37.7749, -122.4194)
    val mapCenter = userLocation ?: defaultLocation

    val cameraPositionState = rememberCameraPositionState {
        position = CameraPosition.fromLatLngZoom(mapCenter, 15f)
    }

    // Update camera when user location changes
    LaunchedEffect(userLocation) {
        userLocation?.let { location ->
            cameraPositionState.animate(
                CameraUpdateFactory.newLatLngZoom(location, 15f)
            )
        }
    }

    val mapProperties = MapProperties(
        isMyLocationEnabled = userLocation != null,
        mapType = MapType.NORMAL,
        isTrafficEnabled = true
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

        // Route polyline (simplified - in real app would use Directions API)
        if (isNavigating && userLocation != null && destination != null) {
            Polyline(
                points = listOf(userLocation, destination),
                color = GuardianBlue,
                width = 8f
            )
        }

        // Emergency services markers
        emergencyServices.forEach { location ->
            Marker(
                state = MarkerState(position = location),
                title = "Emergency Service",
                icon = BitmapDescriptorFactory.defaultMarker(BitmapDescriptorFactory.HUE_RED),
                snippet = "Hospital/Police Station"
            )
        }

        // Safe zones (circles)
        safeZones.forEach { location ->
            Circle(
                center = location,
                radius = 200.0, // 200 meters
                fillColor = SafeColor.copy(alpha = 0.2f),
                strokeColor = SafeColor,
                strokeWidth = 2f
            )
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
