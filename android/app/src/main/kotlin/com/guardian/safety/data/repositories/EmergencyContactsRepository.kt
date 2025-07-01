package com.guardian.safety.data.repositories

import com.google.firebase.firestore.FirebaseFirestore
import com.guardian.safety.data.models.EmergencyContact
import com.guardian.safety.data.models.User
import kotlinx.coroutines.tasks.await
import java.util.UUID
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class EmergencyContactsRepository @Inject constructor(
    private val firestore: FirebaseFirestore
) {

    suspend fun addEmergencyContact(
        userId: String,
        name: String,
        relationship: String,
        guardianKey: String,
        priority: Int
    ): Result<EmergencyContact> {
        return try {
            // First verify the guardian key exists
            val guardianUser = findUserByGuardianKey(guardianKey)
            if (guardianUser == null) {
                return Result.failure(Exception("Invalid Guardian Key"))
            }

            val contactId = UUID.randomUUID().toString()
            val contact = EmergencyContact(
                id = contactId,
                name = name,
                relationship = relationship,
                guardianKey = guardianKey,
                priority = priority,
                isVerified = true, // Since we found the user
                addedAt = System.currentTimeMillis()
            )

            // Get current user profile
            val userDoc = firestore.collection("users").document(userId).get().await()
            val currentUser = userDoc.toObject(User::class.java) ?: return Result.failure(Exception("User not found"))

            // Add contact to user's emergency contacts list
            val updatedContacts = currentUser.emergencyContacts + contact
            val updatedUser = currentUser.copy(emergencyContacts = updatedContacts)

            firestore.collection("users").document(userId).set(updatedUser).await()
            Result.success(contact)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun removeEmergencyContact(userId: String, contactId: String): Result<Unit> {
        return try {
            val userDoc = firestore.collection("users").document(userId).get().await()
            val currentUser = userDoc.toObject(User::class.java) ?: return Result.failure(Exception("User not found"))

            val updatedContacts = currentUser.emergencyContacts.filter { it.id != contactId }
            val updatedUser = currentUser.copy(emergencyContacts = updatedContacts)

            firestore.collection("users").document(userId).set(updatedUser).await()
            Result.success(Unit)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun updateEmergencyContact(userId: String, contact: EmergencyContact): Result<Unit> {
        return try {
            val userDoc = firestore.collection("users").document(userId).get().await()
            val currentUser = userDoc.toObject(User::class.java) ?: return Result.failure(Exception("User not found"))

            val updatedContacts = currentUser.emergencyContacts.map { existingContact ->
                if (existingContact.id == contact.id) contact else existingContact
            }
            val updatedUser = currentUser.copy(emergencyContacts = updatedContacts)

            firestore.collection("users").document(userId).set(updatedUser).await()
            Result.success(Unit)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun findUserByGuardianKey(guardianKey: String): User? {
        return try {
            val querySnapshot = firestore.collection("users")
                .whereEqualTo("guardianKey", guardianKey)
                .get()
                .await()

            if (querySnapshot.documents.isNotEmpty()) {
                querySnapshot.documents.first().toObject(User::class.java)
            } else {
                null
            }
        } catch (e: Exception) {
            null
        }
    }

    suspend fun generateGuardianKey(userId: String): Result<String> {
        return try {
            val guardianKey = generateUniqueKey()
            
            // Update user with the new guardian key
            firestore.collection("users").document(userId)
                .update("guardianKey", guardianKey)
                .await()
            
            Result.success(guardianKey)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    private suspend fun generateUniqueKey(): String {
        var attempts = 0
        val maxAttempts = 10
        
        while (attempts < maxAttempts) {
            val key = generateRandomKey()
            val existingUser = findUserByGuardianKey(key)
            if (existingUser == null) {
                return key
            }
            attempts++
        }
        
        // Fallback to UUID if we can't generate a unique key
        return UUID.randomUUID().toString().replace("-", "").take(8).uppercase()
    }

    private fun generateRandomKey(): String {
        val chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
        return (1..8)
            .map { chars.random() }
            .joinToString("")
    }
}
