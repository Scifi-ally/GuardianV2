package com.guardian.safety.services

import android.content.Context
import android.content.Intent
import android.net.Uri
import com.google.android.gms.maps.model.LatLng
import com.google.firebase.firestore.FirebaseFirestore
import com.google.firebase.functions.FirebaseFunctions
import com.guardian.safety.data.model.EmergencyContact
import com.guardian.safety.data.model.UserProfile
import dagger.hilt.android.qualifiers.ApplicationContext
import kotlinx.coroutines.tasks.await
import java.util.*
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class SOSService @Inject constructor(
    @ApplicationContext private val context: Context,
    private val firestore: FirebaseFirestore,
    private val functions: FirebaseFunctions
) {
    
    suspend fun triggerEmergency(
        userProfile: UserProfile,
        location: LatLng?,
        emergencyType: EmergencyType = EmergencyType.GENERAL
    ): Result<Unit> {
        return try {
            // 1. Log emergency event
            val emergencyEvent = mapOf(
                "userId" to userProfile.uid,
                "userGuardianKey" to userProfile.guardianKey,
                "userName" to userProfile.displayName,
                "emergencyType" to emergencyType.name,
                "location" to if (location != null) {
                    mapOf("lat" to location.latitude, "lng" to location.longitude)
                } else null,
                "timestamp" to Date(),
                "status" to "ACTIVE"
            )
            
            firestore.collection("emergencies")
                .add(emergencyEvent)
                .await()
            
            // 2. Notify emergency contacts
            notifyEmergencyContacts(userProfile, location, emergencyType)
            
            // 3. Call emergency services if critical
            if (emergencyType == EmergencyType.CRITICAL) {
                callEmergencyServices()
            }
            
            Result.success(Unit)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
    
    private suspend fun notifyEmergencyContacts(
        userProfile: UserProfile,
        location: LatLng?,
        emergencyType: EmergencyType
    ) {
        val locationMessage = if (location != null) {
            "Location: https://maps.google.com/?q=${location.latitude},${location.longitude}"
        } else {
            "Location: Unknown"
        }
        
        val message = """
            🚨 EMERGENCY ALERT 🚨
            
            ${userProfile.displayName} has triggered an emergency alert.
            
            Type: ${emergencyType.displayName}
            Time: ${Date()}
            $locationMessage
            
            Guardian Key: ${userProfile.guardianKey}
            
            Please check on them immediately or contact emergency services if needed.
        """.trimIndent()
        
        // Send notifications via Firebase Functions
        userProfile.emergencyContacts.forEach { contact ->
            if (contact.isActive) {
                sendNotificationToContact(contact, message, userProfile, location)
            }
        }
    }
    
    private suspend fun sendNotificationToContact(
        contact: EmergencyContact,
        message: String,
        userProfile: UserProfile,
        location: LatLng?
    ) {
        try {
            // Call Firebase Function to send SMS/Push notification
            val data = mapOf(
                "contactGuardianKey" to contact.guardianKey,
                "contactPhone" to contact.phone,
                "message" to message,
                "emergencyData" to mapOf(
                    "userId" to userProfile.uid,
                    "userName" to userProfile.displayName,
                    "userGuardianKey" to userProfile.guardianKey,
                    "location" to if (location != null) {
                        mapOf("lat" to location.latitude, "lng" to location.longitude)
                    } else null
                )
            )
            
            functions.getHttpsCallable("sendEmergencyNotification")
                .call(data)
                .await()
        } catch (e: Exception) {
            // Log error but don't fail the whole SOS process
            e.printStackTrace()
        }
    }
    
    private fun callEmergencyServices() {
        try {
            val intent = Intent(Intent.ACTION_CALL).apply {
                data = Uri.parse("tel:911") // Or local emergency number
                flags = Intent.FLAG_ACTIVITY_NEW_TASK
            }
            context.startActivity(intent)
        } catch (e: Exception) {
            // Fallback to dialer
            val intent = Intent(Intent.ACTION_DIAL).apply {
                data = Uri.parse("tel:911")
                flags = Intent.FLAG_ACTIVITY_NEW_TASK
            }
            context.startActivity(intent)
        }
    }
    
    suspend fun cancelEmergency(userProfile: UserProfile): Result<Unit> {
        return try {
            // Update active emergencies to cancelled
            val snapshot = firestore.collection("emergencies")
                .whereEqualTo("userId", userProfile.uid)
                .whereEqualTo("status", "ACTIVE")
                .get()
                .await()
            
            snapshot.documents.forEach { doc ->
                doc.reference.update("status", "CANCELLED").await()
            }
            
            // Notify contacts of cancellation
            val cancelMessage = """
                ✅ EMERGENCY CANCELLED
                
                ${userProfile.displayName} has cancelled their emergency alert.
                
                Time: ${Date()}
                Guardian Key: ${userProfile.guardianKey}
                
                They are now safe.
            """.trimIndent()
            
            userProfile.emergencyContacts.forEach { contact ->
                if (contact.isActive) {
                    sendCancellationToContact(contact, cancelMessage)
                }
            }
            
            Result.success(Unit)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
    
    private suspend fun sendCancellationToContact(
        contact: EmergencyContact,
        message: String
    ) {
        try {
            val data = mapOf(
                "contactGuardianKey" to contact.guardianKey,
                "contactPhone" to contact.phone,
                "message" to message,
                "type" to "CANCELLATION"
            )
            
            functions.getHttpsCallable("sendEmergencyNotification")
                .call(data)
                .await()
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }
}

enum class EmergencyType(val displayName: String) {
    GENERAL("General Emergency"),
    MEDICAL("Medical Emergency"),
    SAFETY("Safety Threat"),
    CRITICAL("Critical Emergency")
}
