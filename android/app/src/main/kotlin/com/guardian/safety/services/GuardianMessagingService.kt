package com.guardian.safety.services

import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Intent
import android.media.RingtoneManager
import android.os.VibrationEffect
import android.os.Vibrator
import androidx.core.app.NotificationCompat
import com.google.firebase.messaging.FirebaseMessagingService
import com.google.firebase.messaging.RemoteMessage
import com.guardian.safety.GuardianApplication
import com.guardian.safety.MainActivity
import com.guardian.safety.R

class GuardianMessagingService : FirebaseMessagingService() {

    override fun onMessageReceived(remoteMessage: RemoteMessage) {
        super.onMessageReceived(remoteMessage)

        // Handle different types of messages
        when (remoteMessage.data["type"]) {
            "sos_alert" -> handleSOSAlert(remoteMessage)
            "location_update" -> handleLocationUpdate(remoteMessage)
            "contact_request" -> handleContactRequest(remoteMessage)
            else -> handleGeneralNotification(remoteMessage)
        }
    }

    private fun handleSOSAlert(remoteMessage: RemoteMessage) {
        val senderName = remoteMessage.data["senderName"] ?: "Someone"
        val message = remoteMessage.data["message"] ?: "Emergency alert!"
        val alertId = remoteMessage.data["alertId"] ?: ""

        // Create high priority notification for SOS
        val intent = Intent(this, MainActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP
            putExtra("alertId", alertId)
            putExtra("type", "sos_alert")
        }

        val pendingIntent = PendingIntent.getActivity(
            this, System.currentTimeMillis().toInt(), intent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        val notification = NotificationCompat.Builder(this, GuardianApplication.SOS_CHANNEL_ID)
            .setContentTitle("🚨 Emergency Alert from $senderName")
            .setContentText(message)
            .setSmallIcon(R.drawable.ic_emergency)
            .setContentIntent(pendingIntent)
            .setAutoCancel(false)
            .setCategory(NotificationCompat.CATEGORY_ALARM)
            .setPriority(NotificationCompat.PRIORITY_MAX)
            .setSound(RingtoneManager.getDefaultUri(RingtoneManager.TYPE_ALARM))
            .setVibrate(longArrayOf(0, 1000, 500, 1000, 500, 1000))
            .setFullScreenIntent(pendingIntent, true)
            .setOngoing(true)
            .addAction(
                R.drawable.ic_check,
                "Acknowledge",
                createAcknowledgeIntent(alertId)
            )
            .addAction(
                android.R.drawable.ic_menu_directions,
                "Navigate",
                createNavigateIntent(alertId)
            )
            .build()

        val notificationManager = getSystemService(NotificationManager::class.java)
        notificationManager.notify(alertId.hashCode(), notification)

        // Trigger emergency vibration
        triggerEmergencyVibration()
    }

    private fun handleLocationUpdate(remoteMessage: RemoteMessage) {
        val senderName = remoteMessage.data["senderName"] ?: "Contact"
        val alertId = remoteMessage.data["alertId"] ?: ""

        // Update existing notification with location info
        val intent = Intent(this, MainActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP
            putExtra("alertId", alertId)
            putExtra("type", "location_update")
        }

        val pendingIntent = PendingIntent.getActivity(
            this, alertId.hashCode(), intent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        val notification = NotificationCompat.Builder(this, GuardianApplication.SOS_CHANNEL_ID)
            .setContentTitle("📍 Location Update from $senderName")
            .setContentText("Location updated - tap to navigate")
            .setSmallIcon(R.drawable.ic_location)
            .setContentIntent(pendingIntent)
            .setAutoCancel(true)
            .setCategory(NotificationCompat.CATEGORY_NAVIGATION)
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .build()

        val notificationManager = getSystemService(NotificationManager::class.java)
        notificationManager.notify(alertId.hashCode() + 1000, notification)
    }

    private fun handleContactRequest(remoteMessage: RemoteMessage) {
        val requesterName = remoteMessage.data["requesterName"] ?: "Someone"
        val guardianKey = remoteMessage.data["guardianKey"] ?: ""

        val intent = Intent(this, MainActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP
            putExtra("guardianKey", guardianKey)
            putExtra("type", "contact_request")
        }

        val pendingIntent = PendingIntent.getActivity(
            this, guardianKey.hashCode(), intent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        val notification = NotificationCompat.Builder(this, GuardianApplication.GENERAL_CHANNEL_ID)
            .setContentTitle("👥 Emergency Contact Request")
            .setContentText("$requesterName wants to add you as an emergency contact")
            .setSmallIcon(android.R.drawable.ic_menu_agenda)
            .setContentIntent(pendingIntent)
            .setAutoCancel(true)
            .setCategory(NotificationCompat.CATEGORY_SOCIAL)
            .setPriority(NotificationCompat.PRIORITY_DEFAULT)
            .build()

        val notificationManager = getSystemService(NotificationManager::class.java)
        notificationManager.notify(guardianKey.hashCode(), notification)
    }

    private fun handleGeneralNotification(remoteMessage: RemoteMessage) {
        val title = remoteMessage.notification?.title ?: "Guardian"
        val body = remoteMessage.notification?.body ?: ""

        val intent = Intent(this, MainActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP
        }

        val pendingIntent = PendingIntent.getActivity(
            this, 0, intent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        val notification = NotificationCompat.Builder(this, GuardianApplication.GENERAL_CHANNEL_ID)
            .setContentTitle(title)
            .setContentText(body)
            .setSmallIcon(android.R.drawable.ic_dialog_info)
            .setContentIntent(pendingIntent)
            .setAutoCancel(true)
            .setCategory(NotificationCompat.CATEGORY_MESSAGE)
            .setPriority(NotificationCompat.PRIORITY_DEFAULT)
            .build()

        val notificationManager = getSystemService(NotificationManager::class.java)
        notificationManager.notify(System.currentTimeMillis().toInt(), notification)
    }

    private fun createAcknowledgeIntent(alertId: String): PendingIntent {
        val intent = Intent(this, MainActivity::class.java).apply {
            putExtra("action", "acknowledge")
            putExtra("alertId", alertId)
        }
        return PendingIntent.getActivity(
            this, alertId.hashCode() + 100, intent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )
    }

    private fun createNavigateIntent(alertId: String): PendingIntent {
        val intent = Intent(this, MainActivity::class.java).apply {
            putExtra("action", "navigate")
            putExtra("alertId", alertId)
        }
        return PendingIntent.getActivity(
            this, alertId.hashCode() + 200, intent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )
    }

    private fun triggerEmergencyVibration() {
        val vibrator = getSystemService(VIBRATOR_SERVICE) as Vibrator
        val pattern = longArrayOf(0, 1000, 500, 1000, 500, 1000, 500, 1000)

        if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.O) {
            vibrator.vibrate(VibrationEffect.createWaveform(pattern, -1))
        } else {
            @Suppress("DEPRECATION")
            vibrator.vibrate(pattern, -1)
        }
    }

    override fun onNewToken(token: String) {
        super.onNewToken(token)
        // Send token to your server here
        // You can use your existing Firebase functions to store the token
    }
}
