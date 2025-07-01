package com.guardian.safety.data.model

import java.util.*

data class UserProfile(
    val uid: String = "",
    val email: String = "",
    val displayName: String = "",
    val guardianKey: String = "",
    val emergencyContacts: List<EmergencyContact> = emptyList(),
    val createdAt: Date = Date(),
    val lastActive: Date = Date(),
    val phone: String? = null,
    val location: String? = null,
    val bio: String? = null,
    val photoURL: String? = null
)

data class EmergencyContact(
    val id: String = "",
    val guardianKey: String = "",
    val name: String = "",
    val phone: String? = null,
    val priority: Int = 0,
    val addedAt: Date = Date(),
    val isActive: Boolean = true
)
