package com.guardian.safety.services

import android.app.Notification
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.content.Intent
import android.content.pm.PackageManager
import android.media.RingtoneManager
import android.os.IBinder
import android.os.VibrationEffect
import android.os.Vibrator
import androidx.core.app.ActivityCompat
import androidx.core.app.NotificationCompat
import com.google.android.gms.location.FusedLocationProviderClient
import com.google.android.gms.location.LocationServices
import com.guardian.safety.GuardianApplication
import com.guardian.safety.MainActivity
import com.guardian.safety.R
import com.guardian.safety.data.models.Location
import com.guardian.safety.data.repositories.AuthRepository
import com.guardian.safety.data.repositories.SOSRepository
import com.guardian.safety.di.AppModule
import kotlinx.coroutines.*

class SOSAlertService : Service() {

    private val sosRepository: SOSRepository by lazy {
        SOSRepository(AppModule.provideFirebaseFirestore())
    }

    private val authRepository: AuthRepository by lazy {
        AuthRepository(AppModule.provideFirebaseAuth(), AppModule.provideFirebaseFirestore())
    }

    private lateinit var fusedLocationClient: FusedLocationProviderClient
    private lateinit var vibrator: Vibrator
    private val serviceJob = SupervisorJob()
    private val serviceScope = CoroutineScope(Dispatchers.IO + serviceJob)

    companion object {
        const val ACTION_SEND_SOS = "SEND_SOS"
        const val ACTION_CANCEL_SOS = "CANCEL_SOS"
        const val EXTRA_MESSAGE = "MESSAGE"
        private const val NOTIFICATION_ID = 1002
    }

    override fun onCreate() {
        super.onCreate()
        fusedLocationClient = LocationServices.getFusedLocationProviderClient(this)
        vibrator = getSystemService(VIBRATOR_SERVICE) as Vibrator
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        when (intent?.action) {
            ACTION_SEND_SOS -> {
                val message = intent.getStringExtra(EXTRA_MESSAGE) ?: "Emergency! I need help!"
                sendSOSAlert(message)
            }
            ACTION_CANCEL_SOS -> {
                stopSelf()
            }
        }
        return START_NOT_STICKY
    }

    override fun onBind(intent: Intent?): IBinder? = null

    private fun sendSOSAlert(message: String) {
        serviceScope.launch {
            try {
                // Get current location
                val location = getCurrentLocation()

                // Get user profile
                val userResult = authRepository.getCurrentUserProfile()
                if (userResult.isFailure) {
                    showErrorNotification("Failed to get user profile")
                    stopSelf()
                    return@launch
                }

                val user = userResult.getOrNull()
                if (user == null) {
                    showErrorNotification("User not found")
                    stopSelf()
                    return@launch
                }

                // Get emergency contacts' user IDs
                val recipients = user.emergencyContacts.mapNotNull { contact ->
                    // In a real implementation, you'd look up the user ID by guardian key
                    // For now, we'll use the guardian key as a placeholder
                    contact.guardianKey
                }

                if (recipients.isEmpty()) {
                    showErrorNotification("No emergency contacts found")
                    stopSelf()
                    return@launch
                }

                // Send SOS alert
                val result = sosRepository.sendSOSAlert(
                    senderId = user.uid,
                    senderName = user.displayName,
                    location = location,
                    message = message,
                    recipients = recipients
                )

                if (result.isSuccess) {
                    val alertId = result.getOrNull()!!
                    showSuccessNotification()
                    startLocationTracking(alertId)
                    triggerEmergencyEffects()
                } else {
                    showErrorNotification("Failed to send SOS alert")
                }
            } catch (e: Exception) {
                showErrorNotification("Error: ${e.message}")
            } finally {
                stopSelf()
            }
        }
    }

    private suspend fun getCurrentLocation(): Location? {
        return try {
            if (ActivityCompat.checkSelfPermission(
                    this,
                    android.Manifest.permission.ACCESS_FINE_LOCATION
                ) != PackageManager.PERMISSION_GRANTED
            ) {
                return null
            }

            suspendCancellableCoroutine { continuation ->
                fusedLocationClient.lastLocation.addOnSuccessListener { location ->
                    if (location != null) {
                        continuation.resume(
                            Location(
                                latitude = location.latitude,
                                longitude = location.longitude,
                                accuracy = location.accuracy,
                                timestamp = System.currentTimeMillis()
                            )
                        ) {}
                    } else {
                        continuation.resume(null) {}
                    }
                }.addOnFailureListener {
                    continuation.resume(null) {}
                }
            }
        } catch (e: Exception) {
            null
        }
    }

    private fun startLocationTracking(alertId: String) {
        val intent = Intent(this, LocationTrackingService::class.java).apply {
            action = LocationTrackingService.ACTION_START_TRACKING
            putExtra(LocationTrackingService.EXTRA_SOS_ALERT_ID, alertId)
        }
        startService(intent)
    }

    private fun triggerEmergencyEffects() {
        // Vibration pattern: short-long-short-long
        val vibrationPattern = longArrayOf(0, 500, 200, 500, 200, 500)

        if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.O) {
            vibrator.vibrate(VibrationEffect.createWaveform(vibrationPattern, -1))
        } else {
            @Suppress("DEPRECATION")
            vibrator.vibrate(vibrationPattern, -1)
        }
    }

    private fun showSuccessNotification() {
        val intent = Intent(this, MainActivity::class.java)
        val pendingIntent = PendingIntent.getActivity(
            this, 0, intent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        val notification = NotificationCompat.Builder(this, GuardianApplication.SOS_CHANNEL_ID)
            .setContentTitle("SOS Alert Sent")
            .setContentText("Emergency contacts have been notified")
            .setSmallIcon(R.drawable.ic_shield)
            .setContentIntent(pendingIntent)
            .setAutoCancel(true)
            .setCategory(NotificationCompat.CATEGORY_ALARM)
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .setSound(RingtoneManager.getDefaultUri(RingtoneManager.TYPE_NOTIFICATION))
            .build()

        val notificationManager = getSystemService(NotificationManager::class.java)
        notificationManager.notify(NOTIFICATION_ID, notification)
    }

    private fun showErrorNotification(message: String) {
        val intent = Intent(this, MainActivity::class.java)
        val pendingIntent = PendingIntent.getActivity(
            this, 0, intent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        val notification = NotificationCompat.Builder(this, GuardianApplication.GENERAL_CHANNEL_ID)
            .setContentTitle("SOS Alert Failed")
            .setContentText(message)
            .setSmallIcon(R.drawable.ic_error)
            .setContentIntent(pendingIntent)
            .setAutoCancel(true)
            .setCategory(NotificationCompat.CATEGORY_ERROR)
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .build()

        val notificationManager = getSystemService(NotificationManager::class.java)
        notificationManager.notify(NOTIFICATION_ID + 1, notification)
    }

    override fun onDestroy() {
        super.onDestroy()
        serviceJob.cancel()
    }
}
