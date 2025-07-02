package com.guardian.safety.services

import com.google.firebase.firestore.FirebaseFirestore
import com.guardian.safety.ui.components.EmergencyContact
import kotlinx.coroutines.tasks.await
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class EmergencyContactService @Inject constructor(
    private val firestore: FirebaseFirestore
) {
    
    suspend fun addEmergencyContact(
        userId: String,
        contact: EmergencyContact
    ): Result<EmergencyContact> {
        return try {
            val userDoc = firestore.collection("users").document(userId)
            val contactsCollection = userDoc.collection("emergencyContacts")
            
            // Add the contact
            contactsCollection.document(contact.id).set(contact).await()
            
            Result.success(contact)
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
            val contactDoc = userDoc.collection("emergencyContacts").document(contactId)
            
            contactDoc.delete().await()
            
            Result.success(Unit)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
    
    suspend fun updateEmergencyContact(
        userId: String,
        contact: EmergencyContact
    ): Result<EmergencyContact> {
        return try {
            val userDoc = firestore.collection("users").document(userId)
            val contactDoc = userDoc.collection("emergencyContacts").document(contact.id)
            
            contactDoc.set(contact).await()
            
            Result.success(contact)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
    
    suspend fun getEmergencyContacts(userId: String): Result<List<EmergencyContact>> {
        return try {
            val userDoc = firestore.collection("users").document(userId)
            val contactsSnapshot = userDoc.collection("emergencyContacts").get().await()
            
            val contacts = contactsSnapshot.documents.mapNotNull { doc ->
                doc.toObject(EmergencyContact::class.java)
            }
            
            Result.success(contacts)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
    
    suspend fun validateContact(contact: EmergencyContact): Result<Unit> {
        return try {
            when {
                contact.name.isBlank() -> 
                    Result.failure(IllegalArgumentException("Contact name cannot be empty"))
                
                contact.phone.isBlank() -> 
                    Result.failure(IllegalArgumentException("Phone number cannot be empty"))
                
                !isValidPhoneNumber(contact.phone) -> 
                    Result.failure(IllegalArgumentException("Invalid phone number format"))
                
                contact.relationship.isBlank() -> 
                    Result.failure(IllegalArgumentException("Relationship cannot be empty"))
                
                else -> Result.success(Unit)
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
    
    suspend fun findContactByGuardianKey(
        userId: String,
        guardianKey: String
    ): Result<EmergencyContact?> {
        return try {
            val userDoc = firestore.collection("users").document(userId)
            val contactsSnapshot = userDoc.collection("emergencyContacts")
                .whereEqualTo("guardianKey", guardianKey)
                .get()
                .await()
            
            val contact = contactsSnapshot.documents.firstOrNull()?.toObject(EmergencyContact::class.java)
            
            Result.success(contact)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
    
    suspend fun setPrimaryContact(
        userId: String,
        contactId: String
    ): Result<Unit> {
        return try {
            val userDoc = firestore.collection("users").document(userId)
            val contactsCollection = userDoc.collection("emergencyContacts")
            
            // First, remove primary status from all contacts
            val allContacts = contactsCollection.get().await()
            val batch = firestore.batch()
            
            allContacts.documents.forEach { doc ->
                batch.update(doc.reference, "isPrimary", false)
            }
            
            // Set the specified contact as primary
            val targetContact = contactsCollection.document(contactId)
            batch.update(targetContact, "isPrimary", true)
            
            batch.commit().await()
            
            Result.success(Unit)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
    
    suspend fun bulkAddContacts(
        userId: String,
        contacts: List<EmergencyContact>
    ): Result<List<EmergencyContact>> {
        return try {
            val userDoc = firestore.collection("users").document(userId)
            val contactsCollection = userDoc.collection("emergencyContacts")
            val batch = firestore.batch()
            
            contacts.forEach { contact ->
                val contactRef = contactsCollection.document(contact.id)
                batch.set(contactRef, contact)
            }
            
            batch.commit().await()
            
            Result.success(contacts)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
    
    suspend fun searchContacts(
        userId: String,
        query: String
    ): Result<List<EmergencyContact>> {
        return try {
            val contacts = getEmergencyContacts(userId).getOrThrow()
            
            val filteredContacts = contacts.filter { contact ->
                contact.name.contains(query, ignoreCase = true) ||
                contact.phone.contains(query) ||
                contact.relationship.contains(query, ignoreCase = true)
            }
            
            Result.success(filteredContacts)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
    
    fun getContactPriority(contact: EmergencyContact): Int {
        return when {
            contact.isPrimary -> 1
            contact.relationship.lowercase() == "family" -> 2
            contact.relationship.lowercase() == "spouse" -> 2
            contact.relationship.lowercase() == "partner" -> 2
            contact.relationship.lowercase() == "friend" -> 3
            else -> 4
        }
    }
    
    fun sortContactsByPriority(contacts: List<EmergencyContact>): List<EmergencyContact> {
        return contacts.sortedWith(compareBy<EmergencyContact> { getContactPriority(it) }
            .thenBy { it.name })
    }
    
    private fun isValidPhoneNumber(phone: String): Boolean {
        // Simple phone number validation
        val phoneRegex = Regex("^[+]?[0-9]{10,15}$")
        val cleanPhone = phone.replace("[\\s\\-\\(\\)]".toRegex(), "")
        return phoneRegex.matches(cleanPhone)
    }
    
    suspend fun exportContacts(userId: String): Result<String> {
        return try {
            val contacts = getEmergencyContacts(userId).getOrThrow()
            
            val csvHeader = "Name,Phone,Relationship,Guardian Key,Is Primary\n"
            val csvData = contacts.joinToString("\n") { contact ->
                "${contact.name},${contact.phone},${contact.relationship},${contact.guardianKey},${contact.isPrimary}"
            }
            
            Result.success(csvHeader + csvData)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
    
    suspend fun importContacts(
        userId: String,
        csvData: String
    ): Result<List<EmergencyContact>> {
        return try {
            val lines = csvData.split("\n").drop(1) // Skip header
            val contacts = mutableListOf<EmergencyContact>()
            
            lines.forEach { line ->
                if (line.isNotBlank()) {
                    val parts = line.split(",")
                    if (parts.size >= 4) {
                        val contact = EmergencyContact(
                            id = java.util.UUID.randomUUID().toString(),
                            name = parts[0].trim(),
                            phone = parts[1].trim(),
                            relationship = parts[2].trim(),
                            guardianKey = parts.getOrNull(3)?.trim() ?: "",
                            isPrimary = parts.getOrNull(4)?.trim()?.toBoolean() ?: false
                        )
                        contacts.add(contact)
                    }
                }
            }
            
            bulkAddContacts(userId, contacts)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
}
