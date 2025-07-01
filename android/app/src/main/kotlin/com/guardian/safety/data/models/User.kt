package com.guardian.safety.data.models

import android.os.Parcelable
import kotlinx.parcelize.Parcelize

@Parcelize
data class User(
    val uid: String = "",
    val email: String = "",
    val displayName: String = "",
    val photoURL: String = "",
    val guardianKey: String = "",
    val emergencyContacts: List<EmergencyContact> = emptyList(),
    val createdAt: Long = System.currentTimeMillis(),
    val lastSeen: Long = System.currentTimeMillis(),
    val isActive: Boolean = true,
    val profileVisibility: String = "private",
    val locationEnabled: Boolean = false,
    val notificationsEnabled: Boolean = true
) : Parcelable

@Parcelize
data class EmergencyContact(
    val id: String = "",
    val name: String = "",
    val relationship: String = "",
    val guardianKey: String = "",
    val priority: Int = 3,
    val isVerified: Boolean = false,
    val addedAt: Long = System.currentTimeMillis()
) : Parcelable

@Parcelize
data class Location(
    val latitude: Double = 0.0,
    val longitude: Double = 0.0,
    val accuracy: Float = 0f,
    val timestamp: Long = System.currentTimeMillis(),
    val address: String = ""
) : Parcelable

@Parcelize
data class SOSAlert(
    val id: String = "",
    val senderId: String = "",
    val senderName: String = "",
    val senderLocation: Location? = null,
    val message: String = "",
    val status: String = "active", // active, acknowledged, resolved
    val timestamp: Long = System.currentTimeMillis(),
    val recipients: List<String> = emptyList(),
    val locationHistory: List<Location> = emptyList()
) : Parcelable

@Parcelize
data class UserStats(
    val safetyScore: Int = 0,
    val weeklyActivity: Int = 0,
    val contactCount: Int = 0,
    val alertsReceived: Int = 0,
    val alertsSent: Int = 0
) : Parcelable
