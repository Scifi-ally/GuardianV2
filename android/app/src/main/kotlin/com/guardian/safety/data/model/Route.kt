package com.guardian.safety.data.model

import com.google.android.gms.maps.model.LatLng

data class RouteDirection(
    val steps: List<RouteStep>,
    val totalDistance: String,
    val totalDuration: String,
    val startAddress: String,
    val endAddress: String,
    val isSafeRoute: Boolean = false,
    val polylinePoints: List<LatLng> = emptyList()
)

data class RouteStep(
    val instruction: String,
    val distance: String,
    val duration: String,
    val maneuver: String = "",
    val startLocation: LatLng,
    val endLocation: LatLng
)
