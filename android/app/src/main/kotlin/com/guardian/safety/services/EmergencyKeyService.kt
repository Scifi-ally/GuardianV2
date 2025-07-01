package com.guardian.safety.services

import javax.inject.Inject
import javax.inject.Singleton
import kotlin.random.Random

@Singleton
class EmergencyKeyService @Inject constructor() {
    
    fun createGuardianKey(uid: String, name: String, email: String): String {
        // Generate guardian key using same logic as web app
        val timestamp = System.currentTimeMillis()
        val random = Random.nextInt(1000, 9999)
        val namePrefix = name.take(3).uppercase()
        
        return "GRD-$namePrefix-$random"
    }

    fun validateGuardianKey(key: String): Boolean {
        return key.startsWith("GRD-") && key.length >= 8
    }

    fun generateShareableKey(guardianKey: String, userProfile: Any): String {
        // Generate shareable emergency key
        return "${guardianKey}-SHARE-${System.currentTimeMillis()}"
    }
}
