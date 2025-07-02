package com.guardian.safety.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.guardian.safety.ui.theme.*
import kotlinx.coroutines.delay

data class LocationData(
    val latitude: Double,
    val longitude: Double,
    val accuracy: Float,
    val timestamp: Long = System.currentTimeMillis()
)

@Composable
fun RealTimeSOSTracker(
    alertId: String? = null,
    isEmergency: Boolean = false,
    onLocationUpdate: ((LocationData) -> Unit)? = null,
    modifier: Modifier = Modifier
) {
    var isTracking by remember { mutableStateOf(false) }
    var lastLocation by remember { mutableStateOf<LocationData?>(null) }
    var error by remember { mutableStateOf<String?>(null) }
    var updateCount by remember { mutableStateOf(0) }
    
    // Start tracking when component mounts or alertId changes
    LaunchedEffect(alertId) {
        if (alertId != null) {
            isTracking = true
            error = null
            
            // Simulate location tracking
            while (isTracking && alertId != null) {
                try {
                    // Simulate getting location
                    val newLocation = LocationData(
                        latitude = 37.7749 + (Math.random() - 0.5) * 0.001,
                        longitude = -122.4194 + (Math.random() - 0.5) * 0.001,
                        accuracy = 5f + (Math.random() * 10).toFloat(),
                        timestamp = System.currentTimeMillis()
                    )
                    
                    lastLocation = newLocation
                    updateCount++
                    onLocationUpdate?.invoke(newLocation)
                    
                    // Update every 30 seconds for emergency mode, 60 seconds for normal
                    delay(if (isEmergency) 30000 else 60000)
                    
                } catch (e: Exception) {
                    error = "Location tracking error: ${e.message}"
                    delay(10000) // Retry after 10 seconds
                }
            }
        } else {
            isTracking = false
        }
    }
    
    // Stop tracking when component is disposed
    DisposableEffect(Unit) {
        onDispose {
            isTracking = false
        }
    }
    
    if (isTracking && alertId != null) {
        Card(
            modifier = modifier.fillMaxWidth(),
            colors = CardDefaults.cardColors(
                containerColor = if (isEmergency) {
                    GuardianRed.copy(alpha = 0.1f)
                } else {
                    MaterialTheme.colorScheme.primary.copy(alpha = 0.1f)
                }
            ),
            border = androidx.compose.foundation.BorderStroke(
                1.dp,
                if (isEmergency) {
                    GuardianRed.copy(alpha = 0.3f)
                } else {
                    MaterialTheme.colorScheme.primary.copy(alpha = 0.3f)
                }
            ),
            shape = RoundedCornerShape(16.dp)
        ) {
            Column(
                modifier = Modifier.padding(20.dp),
                verticalArrangement = Arrangement.spacedBy(16.dp)
            ) {
                // Header
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    Box(
                        modifier = Modifier
                            .size(40.dp)
                            .clip(CircleShape)
                            .background(
                                if (isEmergency) GuardianRed.copy(alpha = 0.2f)
                                else MaterialTheme.colorScheme.primary.copy(alpha = 0.2f)
                            ),
                        contentAlignment = Alignment.Center
                    ) {
                        Icon(
                            imageVector = Icons.Default.GpsFixed,
                            contentDescription = "GPS Tracking",
                            tint = if (isEmergency) GuardianRed else MaterialTheme.colorScheme.primary,
                            modifier = Modifier.size(20.dp)
                        )
                    }
                    
                    Column {
                        Text(
                            text = if (isEmergency) "Emergency Location Tracking" else "Real-Time Location Tracking",
                            style = MaterialTheme.typography.titleMedium,
                            fontWeight = FontWeight.Bold
                        )
                        
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(8.dp)
                        ) {
                            Box(
                                modifier = Modifier
                                    .size(8.dp)
                                    .clip(CircleShape)
                                    .background(GuardianGreen)
                            )
                            Text(
                                text = "Active",
                                style = MaterialTheme.typography.bodySmall,
                                color = GuardianGreen,
                                fontWeight = FontWeight.Medium
                            )
                        }
                    }
                }
                
                // Status Information
                if (error != null) {
                    Card(
                        colors = CardDefaults.cardColors(
                            containerColor = GuardianRed.copy(alpha = 0.1f)
                        ),
                        border = androidx.compose.foundation.BorderStroke(
                            1.dp,
                            GuardianRed.copy(alpha = 0.3f)
                        )
                    ) {
                        Row(
                            modifier = Modifier.padding(12.dp),
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(8.dp)
                        ) {
                            Icon(
                                imageVector = Icons.Default.Warning,
                                contentDescription = "Error",
                                tint = GuardianRed,
                                modifier = Modifier.size(16.dp)
                            )
                            Text(
                                text = error!!,
                                style = MaterialTheme.typography.bodySmall,
                                color = GuardianRed
                            )
                        }
                    }
                } else {
                    Column(
                        verticalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        // Update frequency
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween
                        ) {
                            Text(
                                text = "Update Interval:",
                                style = MaterialTheme.typography.bodyMedium,
                                color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.7f)
                            )
                            Text(
                                text = if (isEmergency) "30 seconds" else "60 seconds",
                                style = MaterialTheme.typography.bodyMedium,
                                fontWeight = FontWeight.Medium
                            )
                        }
                        
                        // Update count
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween
                        ) {
                            Text(
                                text = "Updates Sent:",
                                style = MaterialTheme.typography.bodyMedium,
                                color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.7f)
                            )
                            Text(
                                text = updateCount.toString(),
                                style = MaterialTheme.typography.bodyMedium,
                                fontWeight = FontWeight.Medium
                            )
                        }
                        
                        // Last location info
                        lastLocation?.let { location ->
                            Divider(modifier = Modifier.padding(vertical = 8.dp))
                            
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween
                            ) {
                                Text(
                                    text = "Accuracy:",
                                    style = MaterialTheme.typography.bodyMedium,
                                    color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.7f)
                                )
                                Text(
                                    text = "±${location.accuracy.toInt()}m",
                                    style = MaterialTheme.typography.bodyMedium,
                                    fontWeight = FontWeight.Medium
                                )
                            }
                            
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween
                            ) {
                                Text(
                                    text = "Last Update:",
                                    style = MaterialTheme.typography.bodyMedium,
                                    color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.7f)
                                )
                                Text(
                                    text = "Just now",
                                    style = MaterialTheme.typography.bodyMedium,
                                    fontWeight = FontWeight.Medium,
                                    color = GuardianGreen
                                )
                            }
                        }
                    }
                }
                
                // Actions
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    OutlinedButton(
                        onClick = { /* View on map */ },
                        modifier = Modifier.weight(1f)
                    ) {
                        Icon(
                            imageVector = Icons.Default.Map,
                            contentDescription = null,
                            modifier = Modifier.size(16.dp)
                        )
                        Spacer(modifier = Modifier.width(8.dp))
                        Text("View on Map")
                    }
                    
                    if (isEmergency) {
                        Button(
                            onClick = { /* Stop tracking */ },
                            modifier = Modifier.weight(1f),
                            colors = ButtonDefaults.buttonColors(
                                containerColor = GuardianRed
                            )
                        ) {
                            Icon(
                                imageVector = Icons.Default.Stop,
                                contentDescription = null,
                                modifier = Modifier.size(16.dp)
                            )
                            Spacer(modifier = Modifier.width(8.dp))
                            Text("Stop")
                        }
                    }
                }
                
                // Privacy note
                if (isEmergency) {
                    Text(
                        text = "Your location is being shared with emergency contacts for your safety. This will continue until you manually stop it or the emergency is resolved.",
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f),
                        lineHeight = 16.dp
                    )
                }
            }
        }
    }
}

// Companion functions for managing real-time tracking
object RealTimeLocationService {
    fun startTracking(
        userId: String,
        onLocationUpdate: (LocationData) -> Unit,
        onError: (Exception) -> Unit,
        options: TrackingOptions = TrackingOptions()
    ): () -> Unit {
        // Return a stop function
        return {
            // Stop tracking logic
        }
    }
}

data class TrackingOptions(
    val interval: Long = 30000, // 30 seconds
    val silentUpdates: Boolean = true,
    val emergencyMode: Boolean = false
)
