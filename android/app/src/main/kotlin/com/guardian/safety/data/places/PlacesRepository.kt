package com.guardian.safety.data.places

import android.content.Context
import com.google.android.gms.maps.model.LatLng
import com.google.firebase.firestore.FirebaseFirestore
import com.guardian.safety.data.model.EmergencyService
import com.guardian.safety.data.model.SafeZone
import dagger.hilt.android.qualifiers.ApplicationContext
import kotlinx.coroutines.tasks.await
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class PlacesRepository @Inject constructor(
    @ApplicationContext private val context: Context,
    private val firestore: FirebaseFirestore
) {
    
    suspend fun getNearbyEmergencyServices(
        userLocation: LatLng,
        radiusKm: Double = 5.0
    ): List<EmergencyService> {
        return try {
            // Query Firestore for emergency services within radius
            val snapshot = firestore.collection("emergency_services")
                .get()
                .await()
            
            val allServices = snapshot.documents.mapNotNull { doc ->
                try {
                    val lat = doc.getDouble("latitude") ?: return@mapNotNull null
                    val lng = doc.getDouble("longitude") ?: return@mapNotNull null
                    val location = LatLng(lat, lng)
                    
                    // Calculate distance
                    val distance = calculateDistance(userLocation, location)
                    if (distance <= radiusKm) {
                        EmergencyService(
                            id = doc.id,
                            name = doc.getString("name") ?: "Emergency Service",
                            type = doc.getString("type") ?: "hospital",
                            location = location,
                            address = doc.getString("address") ?: "",
                            phone = doc.getString("phone") ?: "",
                            isActive = doc.getBoolean("isActive") ?: true,
                            distance = distance
                        )
                    } else null
                } catch (e: Exception) {
                    null
                }
            }.sortedBy { it.distance }
            
            // If no services in Firestore, use Google Places API fallback
            if (allServices.isEmpty()) {
                return getEmergencyServicesFromGooglePlaces(userLocation, radiusKm)
            }
            
            allServices
        } catch (e: Exception) {
            // Fallback to Google Places API
            getEmergencyServicesFromGooglePlaces(userLocation, radiusKm)
        }
    }
    
    suspend fun getNearbySafeZones(
        userLocation: LatLng,
        radiusKm: Double = 2.0
    ): List<SafeZone> {
        return try {
            val snapshot = firestore.collection("safe_zones")
                .get()
                .await()
            
            snapshot.documents.mapNotNull { doc ->
                try {
                    val lat = doc.getDouble("latitude") ?: return@mapNotNull null
                    val lng = doc.getDouble("longitude") ?: return@mapNotNull null
                    val location = LatLng(lat, lng)
                    
                    val distance = calculateDistance(userLocation, location)
                    if (distance <= radiusKm) {
                        SafeZone(
                            id = doc.id,
                            name = doc.getString("name") ?: "Safe Zone",
                            type = doc.getString("type") ?: "police_station",
                            location = location,
                            radius = doc.getDouble("radius") ?: 200.0,
                            description = doc.getString("description") ?: "",
                            isActive = doc.getBoolean("isActive") ?: true,
                            distance = distance
                        )
                    } else null
                } catch (e: Exception) {
                    null
                }
            }.sortedBy { it.distance }
        } catch (e: Exception) {
            emptyList()
        }
    }
    
    private suspend fun getEmergencyServicesFromGooglePlaces(
        userLocation: LatLng,
        radiusKm: Double
    ): List<EmergencyService> {
        // In a real implementation, this would use Google Places API
        // For now, returning basic services that should exist in most areas
        return listOf(
            EmergencyService(
                id = "emergency_911",
                name = "Emergency Services (911)",
                type = "emergency",
                location = userLocation,
                address = "Emergency Response",
                phone = "911",
                isActive = true,
                distance = 0.0
            )
        )
    }
    
    private fun calculateDistance(point1: LatLng, point2: LatLng): Double {
        val earthRadius = 6371.0 // Earth's radius in kilometers
        
        val lat1Rad = Math.toRadians(point1.latitude)
        val lat2Rad = Math.toRadians(point2.latitude)
        val deltaLatRad = Math.toRadians(point2.latitude - point1.latitude)
        val deltaLngRad = Math.toRadians(point2.longitude - point1.longitude)
        
        val a = Math.sin(deltaLatRad / 2) * Math.sin(deltaLatRad / 2) +
                Math.cos(lat1Rad) * Math.cos(lat2Rad) *
                Math.sin(deltaLngRad / 2) * Math.sin(deltaLngRad / 2)
        
        val c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
        
        return earthRadius * c
    }
    
    suspend fun addEmergencyService(service: EmergencyService): Result<Unit> {
        return try {
            firestore.collection("emergency_services")
                .document(service.id)
                .set(
                    mapOf(
                        "name" to service.name,
                        "type" to service.type,
                        "latitude" to service.location.latitude,
                        "longitude" to service.location.longitude,
                        "address" to service.address,
                        "phone" to service.phone,
                        "isActive" to service.isActive
                    )
                )
                .await()
            Result.success(Unit)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
    
    suspend fun addSafeZone(safeZone: SafeZone): Result<Unit> {
        return try {
            firestore.collection("safe_zones")
                .document(safeZone.id)
                .set(
                    mapOf(
                        "name" to safeZone.name,
                        "type" to safeZone.type,
                        "latitude" to safeZone.location.latitude,
                        "longitude" to safeZone.location.longitude,
                        "radius" to safeZone.radius,
                        "description" to safeZone.description,
                        "isActive" to safeZone.isActive
                    )
                )
                .await()
            Result.success(Unit)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
}
