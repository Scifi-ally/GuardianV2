package com.guardian.safety

import android.app.Application
import android.app.NotificationChannel
import android.app.NotificationManager
import android.os.Build

class GuardianApplication : Application() {

    companion object {
        const val SOS_CHANNEL_ID = "sos_alerts"
        const val LOCATION_CHANNEL_ID = "location_tracking"
        const val GENERAL_CHANNEL_ID = "general_notifications"
    }

    override fun onCreate() {
        super.onCreate()
        createNotificationChannels()
    }

    private fun createNotificationChannels() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val notificationManager = getSystemService(NotificationManager::class.java)

            // SOS Alerts Channel
            val sosChannel = NotificationChannel(
                SOS_CHANNEL_ID,
                "SOS Alerts",
                NotificationManager.IMPORTANCE_HIGH
            ).apply {
                description = "Emergency SOS alert notifications"
                enableVibration(true)
                setShowBadge(true)
            }

            // Location Tracking Channel
            val locationChannel = NotificationChannel(
                LOCATION_CHANNEL_ID,
                "Location Tracking",
                NotificationManager.IMPORTANCE_LOW
            ).apply {
                description = "Background location tracking for safety"
                enableVibration(false)
                setShowBadge(false)
            }

            // General Notifications Channel
            val generalChannel = NotificationChannel(
                GENERAL_CHANNEL_ID,
                "General Notifications",
                NotificationManager.IMPORTANCE_DEFAULT
            ).apply {
                description = "General app notifications"
                enableVibration(true)
                setShowBadge(true)
            }

            notificationManager.createNotificationChannels(
                listOf(sosChannel, locationChannel, generalChannel)
            )
        }
    }
}
