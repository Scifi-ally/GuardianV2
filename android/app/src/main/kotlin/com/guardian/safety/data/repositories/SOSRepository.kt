package com.guardian.safety.data.repositories

import com.google.firebase.firestore.FirebaseFirestore
import com.google.firebase.firestore.Query
import com.guardian.safety.data.models.Location
import com.guardian.safety.data.models.SOSAlert
import kotlinx.coroutines.channels.awaitClose
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.callbackFlow
import kotlinx.coroutines.tasks.await
import java.util.UUID

class SOSRepository(
    private val firestore: FirebaseFirestore
) {

    suspend fun sendSOSAlert(
        senderId: String,
        senderName: String,
        location: Location?,
        message: String,
        recipients: List<String>
    ): Result<String> {
        return try {
            val alertId = UUID.randomUUID().toString()
            val alert = SOSAlert(
                id = alertId,
                senderId = senderId,
                senderName = senderName,
                senderLocation = location,
                message = message,
                recipients = recipients,
                timestamp = System.currentTimeMillis()
            )

            firestore.collection("sosAlerts").document(alertId).set(alert).await()
            Result.success(alertId)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun updateSOSLocation(alertId: String, location: Location): Result<Unit> {
        return try {
            val alertRef = firestore.collection("sosAlerts").document(alertId)
            val currentAlert = alertRef.get().await().toObject(SOSAlert::class.java)

            if (currentAlert != null) {
                val updatedHistory = currentAlert.locationHistory + location
                alertRef.update(
                    mapOf(
                        "senderLocation" to location,
                        "locationHistory" to updatedHistory
                    )
                ).await()
            }

            Result.success(Unit)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun acknowledgeSOSAlert(alertId: String, acknowledgerId: String): Result<Unit> {
        return try {
            firestore.collection("sosAlerts").document(alertId)
                .update("status", "acknowledged")
                .await()
            Result.success(Unit)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun resolveSOSAlert(alertId: String): Result<Unit> {
        return try {
            firestore.collection("sosAlerts").document(alertId)
                .update("status", "resolved")
                .await()
            Result.success(Unit)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    fun getSOSAlertsForUser(userId: String): Flow<List<SOSAlert>> = callbackFlow {
        val listener = firestore.collection("sosAlerts")
            .whereArrayContains("recipients", userId)
            .whereEqualTo("status", "active")
            .orderBy("timestamp", Query.Direction.DESCENDING)
            .addSnapshotListener { snapshot, error ->
                if (error != null) {
                    close(error)
                    return@addSnapshotListener
                }

                val alerts = snapshot?.documents?.mapNotNull { doc ->
                    doc.toObject(SOSAlert::class.java)
                } ?: emptyList()

                trySend(alerts)
            }

        awaitClose { listener.remove() }
    }

    fun getUserSentAlerts(userId: String): Flow<List<SOSAlert>> = callbackFlow {
        val listener = firestore.collection("sosAlerts")
            .whereEqualTo("senderId", userId)
            .orderBy("timestamp", Query.Direction.DESCENDING)
            .addSnapshotListener { snapshot, error ->
                if (error != null) {
                    close(error)
                    return@addSnapshotListener
                }

                val alerts = snapshot?.documents?.mapNotNull { doc ->
                    doc.toObject(SOSAlert::class.java)
                } ?: emptyList()

                trySend(alerts)
            }

        awaitClose { listener.remove() }
    }
}
