package com.guardian.safety.data.model

import com.google.android.gms.maps.model.LatLng

data class EmergencyService(
    val id: String,
    val name: String,
    val type: String, // "hospital", "police", "fire_station", "emergency"
    val location: LatLng,
    val address: String,
    val phone: String,
    val isActive: Boolean = true,
    val distance: Double = 0.0 // Distance from user in km
)

data class SafeZone(
    val id: String,
    val name: String,
    val type: String, // "police_station", "hospital", "shopping_center", "public_area"
    val location: LatLng,
    val radius: Double, // Radius in meters
    val description: String,
    val isActive: Boolean = true,
    val distance: Double = 0.0 // Distance from user in km
)
