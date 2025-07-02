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

@Composable
fun BackgroundSafetyMonitor(
    onEmergencyDetected: ((String) -> Unit)? = null,
    modifier: Modifier = Modifier
) {
    var isVoiceListening by remember { mutableStateOf(false) }
    var lastLocationUpdate by remember { mutableStateOf<String?>(null) }
    var safetyServices by remember {
        mutableStateOf(
            SafetyServices(
                voiceActivation = false,
                locationTracking = false,
                emergencyDetection = true,
                backgroundMonitoring = true
            )
        )
    }
    
    // Simulated voice listening state
    LaunchedEffect(safetyServices.voiceActivation) {
        if (safetyServices.voiceActivation) {
            while (safetyServices.voiceActivation) {
                isVoiceListening = true
                delay(2000)
                isVoiceListening = false
                delay(1000)
            }
        } else {
            isVoiceListening = false
        }
    }
    
    // Update location timestamp
    LaunchedEffect(safetyServices.locationTracking) {
        if (safetyServices.locationTracking) {
            while (safetyServices.locationTracking) {
                lastLocationUpdate = "Updated ${System.currentTimeMillis()}"
                delay(30000) // Update every 30 seconds
            }
        }
    }
    
    Card(
        modifier = modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(
            containerColor = MaterialTheme.colorScheme.surface
        ),
        elevation = CardDefaults.cardElevation(defaultElevation = 4.dp),
        shape = RoundedCornerShape(16.dp)
    ) {
        Column(
            modifier = Modifier.padding(20.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            // Header
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                Box(
                    modifier = Modifier
                        .size(32.dp)
                        .clip(CircleShape)
                        .background(MaterialTheme.colorScheme.primary.copy(alpha = 0.2f)),
                    contentAlignment = Alignment.Center
                ) {
                    Icon(
                        imageVector = Icons.Default.Security,
                        contentDescription = "Safety Monitor",
                        tint = MaterialTheme.colorScheme.primary,
                        modifier = Modifier.size(16.dp)
                    )
                }
                Column {
                    Text(
                        text = "Safety Monitor",
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.Bold
                    )
                    Text(
                        text = "Background protection active",
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f)
                    )
                }
            }
            
            // Safety Services
            Column(
                verticalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                // Voice Activation
                SafetyServiceItem(
                    icon = Icons.Default.Mic,
                    title = "Voice Activation",
                    description = "Listen for emergency keywords",
                    isActive = safetyServices.voiceActivation,
                    isListening = isVoiceListening,
                    onToggle = { 
                        safetyServices = safetyServices.copy(voiceActivation = it)
                    }
                )
                
                // Location Tracking
                SafetyServiceItem(
                    icon = Icons.Default.LocationOn,
                    title = "Location Tracking",
                    description = "Real-time location monitoring",
                    isActive = safetyServices.locationTracking,
                    lastUpdate = lastLocationUpdate,
                    onToggle = { 
                        safetyServices = safetyServices.copy(locationTracking = it)
                    }
                )
                
                // Emergency Detection
                SafetyServiceItem(
                    icon = Icons.Default.MonitorHeart,
                    title = "Emergency Detection",
                    description = "Pattern-based emergency detection",
                    isActive = safetyServices.emergencyDetection,
                    onToggle = { 
                        safetyServices = safetyServices.copy(emergencyDetection = it)
                    }
                )
                
                // Background Monitoring
                SafetyServiceItem(
                    icon = Icons.Default.Shield,
                    title = "Background Monitoring",
                    description = "Continuous safety monitoring",
                    isActive = safetyServices.backgroundMonitoring,
                    onToggle = { 
                        safetyServices = safetyServices.copy(backgroundMonitoring = it)
                    }
                )
            }
            
            // Status Summary
            Card(
                colors = CardDefaults.cardColors(
                    containerColor = when {
                        safetyServices.backgroundMonitoring -> GuardianGreen.copy(alpha = 0.1f)
                        safetyServices.voiceActivation || safetyServices.locationTracking -> GuardianYellow.copy(alpha = 0.1f)
                        else -> GuardianGray100
                    }
                ),
                shape = RoundedCornerShape(12.dp)
            ) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(16.dp),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    Icon(
                        imageVector = when {
                            safetyServices.backgroundMonitoring -> Icons.Default.CheckCircle
                            safetyServices.voiceActivation || safetyServices.locationTracking -> Icons.Default.Warning
                            else -> Icons.Default.Info
                        },
                        contentDescription = null,
                        tint = when {
                            safetyServices.backgroundMonitoring -> GuardianGreen
                            safetyServices.voiceActivation || safetyServices.locationTracking -> GuardianYellow
                            else -> MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f)
                        }
                    )
                    
                    Column {
                        Text(
                            text = when {
                                safetyServices.backgroundMonitoring -> "All Systems Active"
                                safetyServices.voiceActivation || safetyServices.locationTracking -> "Partial Protection"
                                else -> "Protection Disabled"
                            },
                            style = MaterialTheme.typography.titleSmall,
                            fontWeight = FontWeight.Medium
                        )
                        Text(
                            text = "Tap services above to configure",
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f)
                        )
                    }
                }
            }
        }
    }
}

@Composable
private fun SafetyServiceItem(
    icon: androidx.compose.ui.graphics.vector.ImageVector,
    title: String,
    description: String,
    isActive: Boolean,
    isListening: Boolean = false,
    lastUpdate: String? = null,
    onToggle: (Boolean) -> Unit
) {
    Card(
        colors = CardDefaults.cardColors(
            containerColor = if (isActive) {
                MaterialTheme.colorScheme.primary.copy(alpha = 0.1f)
            } else {
                MaterialTheme.colorScheme.surface
            }
        ),
        border = androidx.compose.foundation.BorderStroke(
            1.dp,
            if (isActive) {
                MaterialTheme.colorScheme.primary.copy(alpha = 0.3f)
            } else {
                MaterialTheme.colorScheme.outline.copy(alpha = 0.2f)
            }
        ),
        shape = RoundedCornerShape(12.dp)
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                Icon(
                    imageVector = icon,
                    contentDescription = title,
                    tint = if (isActive) {
                        if (isListening) GuardianGreen else MaterialTheme.colorScheme.primary
                    } else {
                        MaterialTheme.colorScheme.onSurface.copy(alpha = 0.4f)
                    },
                    modifier = Modifier.size(20.dp)
                )
                
                Column {
                    Text(
                        text = title,
                        style = MaterialTheme.typography.titleSmall,
                        fontWeight = FontWeight.Medium
                    )
                    Text(
                        text = description,
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f)
                    )
                    
                    if (isListening) {
                        Text(
                            text = "Listening...",
                            style = MaterialTheme.typography.labelSmall,
                            color = GuardianGreen,
                            fontWeight = FontWeight.Medium
                        )
                    }
                    
                    if (lastUpdate != null && isActive) {
                        Text(
                            text = "Active",
                            style = MaterialTheme.typography.labelSmall,
                            color = GuardianGreen,
                            fontWeight = FontWeight.Medium
                        )
                    }
                }
            }
            
            Switch(
                checked = isActive,
                onCheckedChange = onToggle,
                colors = SwitchDefaults.colors(
                    checkedThumbColor = MaterialTheme.colorScheme.primary,
                    checkedTrackColor = MaterialTheme.colorScheme.primary.copy(alpha = 0.5f)
                )
            )
        }
    }
}

data class SafetyServices(
    val voiceActivation: Boolean = false,
    val locationTracking: Boolean = false,
    val emergencyDetection: Boolean = true,
    val backgroundMonitoring: Boolean = true
)
