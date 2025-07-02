package com.guardian.safety.ui.screens.guardian

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.navigation.NavHostController
import com.guardian.safety.ui.components.*
import com.guardian.safety.ui.viewmodel.AuthViewModel
import com.guardian.safety.ui.theme.*

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun EnhancedGuardianScreen(
    navController: NavHostController,
    authViewModel: AuthViewModel = hiltViewModel()
) {
    val userProfile by authViewModel.userProfile.collectAsStateWithLifecycle()
    var activeAlertId by remember { mutableStateOf<String?>(null) }
    var safetyStatus by remember { mutableStateOf("safe") } // "safe", "alert", "emergency"
    var showSafetyTutorial by remember { mutableStateOf(false) }
    var emergencyContacts by remember { mutableStateOf(emptyList<EmergencyContact>()) }
    
    Box(modifier = Modifier.fillMaxSize()) {
        // Background gradient
        Box(
            modifier = Modifier
                .fillMaxSize()
                .background(
                    brush = Brush.verticalGradient(
                        colors = listOf(
                            MaterialTheme.colorScheme.primary.copy(alpha = 0.1f),
                            MaterialTheme.colorScheme.background
                        )
                    )
                )
        )
        
        LazyColumn(
            modifier = Modifier
                .fillMaxSize()
                .padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(20.dp),
            contentPadding = PaddingValues(bottom = 120.dp) // Account for bottom navigation
        ) {
            item {
                // Header with user info
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    colors = CardDefaults.cardColors(
                        containerColor = MaterialTheme.colorScheme.surface
                    ),
                    elevation = CardDefaults.cardElevation(defaultElevation = 4.dp),
                    shape = RoundedCornerShape(20.dp)
                ) {
                    Row(
                        modifier = Modifier.padding(20.dp),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(16.dp)
                    ) {
                        // User avatar
                        Box(
                            modifier = Modifier
                                .size(60.dp)
                                .clip(CircleShape)
                                .background(MaterialTheme.colorScheme.primary.copy(alpha = 0.1f)),
                            contentAlignment = Alignment.Center
                        ) {
                            Icon(
                                imageVector = Icons.Default.Person,
                                contentDescription = "Profile",
                                tint = MaterialTheme.colorScheme.primary,
                                modifier = Modifier.size(32.dp)
                            )
                        }
                        
                        Column {
                            Text(
                                text = "Welcome back,",
                                style = MaterialTheme.typography.titleMedium,
                                color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.7f)
                            )
                            Text(
                                text = userProfile?.displayName ?: "Guardian User",
                                style = MaterialTheme.typography.headlineMedium,
                                fontWeight = FontWeight.Bold,
                                color = MaterialTheme.colorScheme.primary
                            )
                        }
                    }
                }
            }
            
            item {
                // Safety Status Card
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    colors = CardDefaults.cardColors(
                        containerColor = when (safetyStatus) {
                            "emergency" -> GuardianRed.copy(alpha = 0.1f)
                            "alert" -> GuardianYellow.copy(alpha = 0.1f)
                            else -> GuardianGreen.copy(alpha = 0.1f)
                        }
                    ),
                    border = androidx.compose.foundation.BorderStroke(
                        1.dp,
                        when (safetyStatus) {
                            "emergency" -> GuardianRed.copy(alpha = 0.3f)
                            "alert" -> GuardianYellow.copy(alpha = 0.3f)
                            else -> GuardianGreen.copy(alpha = 0.3f)
                        }
                    ),
                    shape = RoundedCornerShape(16.dp)
                ) {
                    Column(
                        modifier = Modifier.padding(20.dp),
                        verticalArrangement = Arrangement.spacedBy(12.dp)
                    ) {
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(12.dp)
                        ) {
                            Icon(
                                imageVector = when (safetyStatus) {
                                    "emergency" -> Icons.Default.Warning
                                    "alert" -> Icons.Default.Info
                                    else -> Icons.Default.CheckCircle
                                },
                                contentDescription = "Safety Status",
                                tint = when (safetyStatus) {
                                    "emergency" -> GuardianRed
                                    "alert" -> GuardianYellow
                                    else -> GuardianGreen
                                },
                                modifier = Modifier.size(24.dp)
                            )
                            
                            Column {
                                Text(
                                    text = when (safetyStatus) {
                                        "emergency" -> "Emergency Active"
                                        "alert" -> "Alert Status"
                                        else -> "All Safe"
                                    },
                                    style = MaterialTheme.typography.titleMedium,
                                    fontWeight = FontWeight.Medium
                                )
                                Text(
                                    text = when (safetyStatus) {
                                        "emergency" -> "Emergency services contacted"
                                        "alert" -> "Monitoring elevated threat"
                                        else -> "No active emergencies"
                                    },
                                    style = MaterialTheme.typography.bodyMedium,
                                    color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.7f)
                                )
                            }
                        }
                    }
                }
            }
            
            item {
                // Enhanced SOS Button
                Box(
                    modifier = Modifier.fillMaxWidth(),
                    contentAlignment = Alignment.Center
                ) {
                    EnhancedSOSButton(
                        onEmergencyTrigger = { alertId ->
                            activeAlertId = alertId
                            safetyStatus = "emergency"
                        },
                        size = "lg"
                    )
                }
            }
            
            item {
                // Guardian Key Card
                userProfile?.guardianKey?.let { guardianKey ->
                    GuardianKeyCard(guardianKey = guardianKey)
                }
            }
            
            item {
                // Emergency Contact Manager
                EmergencyContactManager(
                    contacts = emergencyContacts,
                    onAddContact = { contact ->
                        emergencyContacts = emergencyContacts + contact
                    },
                    onRemoveContact = { contactId ->
                        emergencyContacts = emergencyContacts.filter { it.id != contactId }
                    },
                    onUpdateContact = { updatedContact ->
                        emergencyContacts = emergencyContacts.map { contact ->
                            if (contact.id == updatedContact.id) updatedContact else contact
                        }
                    }
                )
            }
            
            item {
                // Background Safety Monitor
                BackgroundSafetyMonitor(
                    onEmergencyDetected = { type ->
                        safetyStatus = "alert"
                        // Handle emergency detection
                    }
                )
            }
            
            item {
                // Real-time SOS Tracker (only if alert is active)
                activeAlertId?.let { alertId ->
                    RealTimeSOSTracker(
                        alertId = alertId,
                        isEmergency = safetyStatus == "emergency",
                        onLocationUpdate = { location ->
                            // Handle location updates
                        }
                    )
                }
            }
            
            item {
                // Quick Actions
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    colors = CardDefaults.cardColors(
                        containerColor = MaterialTheme.colorScheme.surface
                    ),
                    shape = RoundedCornerShape(16.dp)
                ) {
                    Column(
                        modifier = Modifier.padding(20.dp),
                        verticalArrangement = Arrangement.spacedBy(16.dp)
                    ) {
                        Text(
                            text = "Quick Actions",
                            style = MaterialTheme.typography.titleMedium,
                            fontWeight = FontWeight.Bold
                        )
                        
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.spacedBy(12.dp)
                        ) {
                            ActionCard(
                                icon = Icons.Default.School,
                                title = "Safety Tutorial",
                                subtitle = "Learn safety features",
                                onClick = { showSafetyTutorial = true },
                                modifier = Modifier.weight(1f)
                            )
                            
                            ActionCard(
                                icon = Icons.Default.LocationOn,
                                title = "Share Location",
                                subtitle = "Send to contacts",
                                onClick = { /* Share location */ },
                                modifier = Modifier.weight(1f)
                            )
                        }
                        
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.spacedBy(12.dp)
                        ) {
                            ActionCard(
                                icon = Icons.Default.Phone,
                                title = "Emergency Call",
                                subtitle = "Call emergency services",
                                onClick = { /* Emergency call */ },
                                modifier = Modifier.weight(1f),
                                isDestructive = true
                            )
                            
                            ActionCard(
                                icon = Icons.Default.Settings,
                                title = "Settings",
                                subtitle = "Configure app",
                                onClick = { /* Navigate to settings */ },
                                modifier = Modifier.weight(1f)
                            )
                        }
                    }
                }
            }
        }
        
        // Bottom Navigation
        Box(
            modifier = Modifier
                .align(Alignment.BottomCenter)
                .padding(16.dp)
        ) {
            BottomNavigation(
                navController = navController,
                onSOSPress = {
                    // Handle SOS press from navbar
                    activeAlertId = "navbar_${System.currentTimeMillis()}"
                    safetyStatus = "emergency"
                }
            )
        }
    }
    
    // Safety Tutorial Dialog
    InteractiveSafetyTutorial(
        isOpen = showSafetyTutorial,
        onClose = { showSafetyTutorial = false },
        onComplete = { showSafetyTutorial = false }
    )
}

@Composable
private fun ActionCard(
    icon: androidx.compose.ui.graphics.vector.ImageVector,
    title: String,
    subtitle: String,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
    isDestructive: Boolean = false
) {
    Card(
        onClick = onClick,
        modifier = modifier,
        colors = CardDefaults.cardColors(
            containerColor = if (isDestructive) {
                GuardianRed.copy(alpha = 0.1f)
            } else {
                MaterialTheme.colorScheme.surface
            }
        ),
        border = androidx.compose.foundation.BorderStroke(
            1.dp,
            if (isDestructive) {
                GuardianRed.copy(alpha = 0.3f)
            } else {
                MaterialTheme.colorScheme.outline.copy(alpha = 0.2f)
            }
        ),
        shape = RoundedCornerShape(12.dp)
    ) {
        Column(
            modifier = Modifier.padding(16.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            Icon(
                imageVector = icon,
                contentDescription = title,
                tint = if (isDestructive) GuardianRed else MaterialTheme.colorScheme.primary,
                modifier = Modifier.size(24.dp)
            )
            
            Text(
                text = title,
                style = MaterialTheme.typography.titleSmall,
                fontWeight = FontWeight.Medium
            )
            
            Text(
                text = subtitle,
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f)
            )
        }
    }
}
