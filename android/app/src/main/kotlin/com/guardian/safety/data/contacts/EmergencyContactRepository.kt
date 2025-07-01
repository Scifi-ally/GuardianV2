package com.guardian.safety.data.contacts

import com.google.firebase.firestore.FirebaseFirestore
import com.guardian.safety.data.model.EmergencyContact
import kotlinx.coroutines.channels.awaitClose
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.callbackFlow
import kotlinx.coroutines.tasks.await
import java.util.*
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class EmergencyContactRepository @Inject constructor(
    private val firestore: FirebaseFirestore
) {
    
    fun getEmergencyContacts(userId: String): Flow<List<EmergencyContact>> = callbackFlow {
        val listener = firestore.collection("users")
            .document(userId)
            .addSnapshotListener { snapshot, error ->
                if (error != null) {
                    trySend(emptyList())
                    return@addSnapshotListener
                }
                
                if (snapshot != null && snapshot.exists()) {
                    val contacts = snapshot.get("emergencyContacts") as? List<Map<String, Any>>
                    val emergencyContacts = contacts?.mapNotNull { contactMap ->
                        try {
                            EmergencyContact(
                                id = contactMap["id"] as? String ?: "",
                                guardianKey = contactMap["guardianKey"] as? String ?: "",
                                name = contactMap["name"] as? String ?: "",
                                phone = contactMap["phone"] as? String,
                                priority = (contactMap["priority"] as? Long)?.toInt() ?: 0,
                                addedAt = Date(), // Convert timestamp if needed
                                isActive = contactMap["isActive"] as? Boolean ?: true
                            )
                        } catch (e: Exception) {
                            null
                        }
                    } ?: emptyList()
                    
                    trySend(emergencyContacts)
                } else {
                    trySend(emptyList())
                }
            }
        
        awaitClose { listener.remove() }
    }
    
    suspend fun addEmergencyContact(
        userId: String, 
        contact: EmergencyContact
    ): Result<Unit> {
        return try {
            val userDoc = firestore.collection("users").document(userId)
            val snapshot = userDoc.get().await()
            
            val currentContacts = if (snapshot.exists()) {
                val contacts = snapshot.get("emergencyContacts") as? List<Map<String, Any>>
                contacts?.toMutableList() ?: mutableListOf()
            } else {
                mutableListOf()
            }
            
            currentContacts.add(
                mapOf(
                    "id" to contact.id,
                    "guardianKey" to contact.guardianKey,
                    "name" to contact.name,
                    "phone" to contact.phone,
                    "priority" to contact.priority,
                    "addedAt" to contact.addedAt,
                    "isActive" to contact.isActive
                )
            )
            
            userDoc.update("emergencyContacts", currentContacts).await()
            Result.success(Unit)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
    
    suspend fun removeEmergencyContact(
        userId: String,
        contactId: String
    ): Result<Unit> {
        return try {
            val userDoc = firestore.collection("users").document(userId)
            val snapshot = userDoc.get().await()
            
            if (snapshot.exists()) {
                val contacts = snapshot.get("emergencyContacts") as? List<Map<String, Any>>
                val updatedContacts = contacts?.filterNot { 
                    it["id"] == contactId 
                } ?: emptyList()
                
                userDoc.update("emergencyContacts", updatedContacts).await()
            }
            
            Result.success(Unit)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
    
    suspend fun findContactByGuardianKey(guardianKey: String): EmergencyContact? {
        return try {
            val snapshot = firestore.collection("users")
                .whereEqualTo("guardianKey", guardianKey)
                .get()
                .await()
            
            if (!snapshot.isEmpty) {
                val userDoc = snapshot.documents.first()
                EmergencyContact(
                    id = userDoc.id,
                    guardianKey = guardianKey,
                    name = userDoc.getString("displayName") ?: "Unknown",
                    phone = userDoc.getString("phone"),
                    priority = 1,
                    addedAt = Date(),
                    isActive = true
                )
            } else {
                null
            }
        } catch (e: Exception) {
            null
        }
    }
}
