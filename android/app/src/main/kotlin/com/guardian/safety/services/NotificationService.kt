package com.guardian.safety.services

import android.app.*
import android.content.Context
import android.content.Intent
import android.os.Build
import androidx.core.app.NotificationCompat
import androidx.core.app.NotificationManagerCompat
import com.guardian.safety.MainActivity
import com.guardian.safety.R
import dagger.hilt.android.qualifiers.ApplicationContext
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class NotificationService @Inject constructor(
    @ApplicationContext private val context: Context
) {
    companion object {
        const val CHANNEL_ID_EMERGENCY = "emergency_alerts"
        const val CHANNEL_ID_LOCATION = "location_sharing"
        const val CHANNEL_ID_GENERAL = "general_notifications"
        
        const val NOTIFICATION_ID_SOS = 1001
        const val NOTIFICATION_ID_LOCATION = 1002
        const val NOTIFICATION_ID_EMERGENCY_RECEIVED = 1003
    }
    
    init {
        createNotificationChannels()
    }
    
    private fun createNotificationChannels() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val emergencyChannel = NotificationChannel(
                CHANNEL_ID_EMERGENCY,
                "Emergency Alerts",
                NotificationManager.IMPORTANCE_HIGH
            ).apply {
                description = "Critical emergency notifications"
                enableVibration(true)
                enableLights(true)
                setBypassDnd(true)
            }
            
            val locationChannel = NotificationChannel(
                CHANNEL_ID_LOCATION,
                "Location Sharing",
                NotificationManager.IMPORTANCE_LOW
            ).apply {
                description = "Background location sharing notifications"
            }
            
            val generalChannel = NotificationChannel(
                CHANNEL_ID_GENERAL,
                "General Notifications",
                NotificationManager.IMPORTANCE_DEFAULT
            ).apply {
                description = "General app notifications"
            }
            
            val notificationManager = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
            notificationManager.createNotificationChannel(emergencyChannel)
            notificationManager.createNotificationChannel(locationChannel)
            notificationManager.createNotificationChannel(generalChannel)
        }
    }
    
    fun showSOSNotification(userName: String, isActive: Boolean) {
        val intent = Intent(context, MainActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TASK
        }
        val pendingIntent = PendingIntent.getActivity(
            context, 0, intent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )
        
        val notification = NotificationCompat.Builder(context, CHANNEL_ID_EMERGENCY)
            .setSmallIcon(R.drawable.ic_emergency)
            .setContentTitle(if (isActive) "🚨 SOS ACTIVE" else "✅ SOS Cancelled")
            .setContentText(
                if (isActive) "Emergency alert has been sent to your contacts"
                else "Emergency alert has been cancelled"
            )
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .setCategory(NotificationCompat.CATEGORY_ALARM)
            .setAutoCancel(!isActive)
            .setOngoing(isActive)
            .setContentIntent(pendingIntent)
            .build()
        
        with(NotificationManagerCompat.from(context)) {
            notify(NOTIFICATION_ID_SOS, notification)
        }
    }
    
    fun showEmergencyReceivedNotification(fromUser: String, message: String) {
        val intent = Intent(context, MainActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TASK
        }
        val pendingIntent = PendingIntent.getActivity(
            context, 0, intent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )
        
        val notification = NotificationCompat.Builder(context, CHANNEL_ID_EMERGENCY)
            .setSmallIcon(R.drawable.ic_emergency)
            .setContentTitle("🚨 EMERGENCY ALERT")
            .setContentText("$fromUser needs help!")
            .setStyle(NotificationCompat.BigTextStyle().bigText(message))
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .setCategory(NotificationCompat.CATEGORY_ALARM)
            .setAutoCancel(true)
            .setContentIntent(pendingIntent)
            .addAction(
                R.drawable.ic_call,
                "Call",
                createCallActionPendingIntent()
            )
            .addAction(
                R.drawable.ic_location,
                "View Location",
                createLocationActionPendingIntent()
            )
            .build()
        
        with(NotificationManagerCompat.from(context)) {
            notify(NOTIFICATION_ID_EMERGENCY_RECEIVED, notification)
        }
    }
    
    fun showLocationSharingNotification(isActive: Boolean) {
        val intent = Intent(context, MainActivity::class.java)
        val pendingIntent = PendingIntent.getActivity(
            context, 0, intent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )
        
        val notification = NotificationCompat.Builder(context, CHANNEL_ID_LOCATION)
            .setSmallIcon(R.drawable.ic_location)
            .setContentTitle("Location Sharing")
            .setContentText(
                if (isActive) "Sharing location with emergency contacts"
                else "Location sharing stopped"
            )
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .setOngoing(isActive)
            .setContentIntent(pendingIntent)
            .build()
        
        with(NotificationManagerCompat.from(context)) {
            notify(NOTIFICATION_ID_LOCATION, notification)
        }
    }
    
    private fun createCallActionPendingIntent(): PendingIntent {
        val intent = Intent(Intent.ACTION_DIAL)
        return PendingIntent.getActivity(
            context, 0, intent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )
    }
    
    private fun createLocationActionPendingIntent(): PendingIntent {
        val intent = Intent(context, MainActivity::class.java)
        return PendingIntent.getActivity(
            context, 0, intent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )
    }
    
    fun cancelAllNotifications() {
        with(NotificationManagerCompat.from(context)) {
            cancelAll()
        }
    }
}
