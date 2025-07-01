package com.guardian.safety.presentation.screens.guardian

import android.content.Context
import androidx.compose.animation.*
import androidx.compose.animation.core.*
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.scale
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.navigation.NavController
import com.guardian.safety.presentation.components.MagicNavbar
import com.guardian.safety.presentation.components.SOSButton
import com.guardian.safety.presentation.components.SOSNotificationPanel
import com.guardian.safety.presentation.viewmodels.AuthViewModel
import com.guardian.safety.presentation.viewmodels.SOSViewModel
import com.guardian.safety.ui.theme.*

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun GuardianScreen(
    navController: NavController,
    authViewModel: AuthViewModel = hiltViewModel(),
    sosViewModel: SOSViewModel = hiltViewModel()
) {
    val context = LocalContext.current
    val userProfile by authViewModel.userProfile.collectAsStateWithLifecycle()
    val sosUiState by sosViewModel.uiState.collectAsStateWithLifecycle()
    val receivedAlerts by sosViewModel.receivedAlerts.collectAsStateWithLifecycle()

    // Load received alerts for current user
    LaunchedEffect(userProfile) {
        userProfile?.let { user ->
            sosViewModel.loadReceivedAlerts(user.uid)
        }
    }

    Scaffold(
        bottomBar = {
            MagicNavbar(
                currentRoute = "guardian",
                onNavigate = { route -> navController.navigate(route) }
            )
        }
    ) { paddingValues ->
        Box(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
        ) {
            // Background gradient
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .background(
                        androidx.compose.ui.graphics.Brush.radialGradient(
                            colors = listOf(
                                GuardianBlue.copy(alpha = 0.1f),
                                Color.White
                            ),
                            radius = 800f
                        )
                    )
            )

            Column(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(24.dp),
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                Spacer(modifier = Modifier.height(32.dp))

                // Welcome Section
                userProfile?.let { user ->
                    Text(
                        text = "Welcome back,",
                        style = MaterialTheme.typography.titleMedium,
                        color = Color.Gray
                    )
                    Text(
                        text = user.displayName,
                        style = MaterialTheme.typography.headlineMedium,
                        fontWeight = FontWeight.Bold,
                        color = GuardianBlue
                    )
                }

                Spacer(modifier = Modifier.height(16.dp))

                // Status Card
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    colors = CardDefaults.cardColors(
                        containerColor = if (receivedAlerts.isNotEmpty()) 
                            GuardianRed.copy(alpha = 0.1f) 
                        else 
                            GuardianGreen.copy(alpha = 0.1f)
                    )
                ) {
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(16.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Icon(
                            imageVector = if (receivedAlerts.isNotEmpty()) Icons.Default.Warning else Icons.Default.CheckCircle,
                            contentDescription = null,
                            tint = if (receivedAlerts.isNotEmpty()) GuardianRed else GuardianGreen,
                            modifier = Modifier.size(24.dp)
                        )
                        Spacer(modifier = Modifier.width(12.dp))
                        Column(modifier = Modifier.weight(1f)) {
                            Text(
                                text = if (receivedAlerts.isNotEmpty()) 
                                    "Emergency Alert Active" 
                                else 
                                    "All Safe",
                                style = MaterialTheme.typography.titleMedium,
                                fontWeight = FontWeight.Medium,
                                color = if (receivedAlerts.isNotEmpty()) GuardianRed else GuardianGreen
                            )
                            Text(
                                text = if (receivedAlerts.isNotEmpty()) 
                                    "${receivedAlerts.size} active alert(s)" 
                                else 
                                    "No active emergencies",
                                style = MaterialTheme.typography.bodyMedium,
                                color = Color.Gray
                            )
                        }
                    }
                }

                Spacer(modifier = Modifier.height(32.dp))

                // SOS Button
                Box(
                    modifier = Modifier.weight(1f),
                    contentAlignment = Alignment.Center
                ) {
                    SOSButton(
                        isActive = sosUiState.isSOSActive,
                        countdown = sosUiState.countdown,
                        onPress = { sosViewModel.startSOSCountdown(context) },
                        onCancel = { sosViewModel.cancelSOS() }
                    )
                }

                Spacer(modifier = Modifier.height(32.dp))

                // Quick Actions
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceEvenly
                ) {
                    QuickActionCard(
                        icon = Icons.Default.People,
                        title = "Contacts",
                        subtitle = "${userProfile?.emergencyContacts?.size ?: 0} contacts",
                        onClick = { navController.navigate("contacts") }
                    )
                    QuickActionCard(
                        icon = Icons.Default.LocationOn,
                        title = "Map",
                        subtitle = "View location",
                        onClick = { navController.navigate("map") }
                    )
                    QuickActionCard(
                        icon = Icons.Default.Person,
                        title = "Profile",
                        subtitle = "Settings",
                        onClick = { navController.navigate("profile") }
                    )
                }

                Spacer(modifier = Modifier.height(16.dp))
            }

            // SOS Notifications
            if (receivedAlerts.isNotEmpty()) {
                receivedAlerts.forEach { alert ->
                    SOSNotificationPanel(
                        alert = alert,
                        onAcknowledge = { 
                            userProfile?.let { user ->
                                sosViewModel.acknowledgeAlert(alert.id, user.uid)
                            }
                        },
                        onNavigate = { navController.navigate("map") },
                        onDismiss = { sosViewModel.resolveAlert(alert.id) }
                    )
                }
            }
        }
    }
}

@Composable
fun QuickActionCard(
    icon: androidx.compose.ui.graphics.vector.ImageVector,
    title: String,
    subtitle: String,
    onClick: () -> Unit
) {
    Card(
        modifier = Modifier
            .width(100.dp)
            .height(100.dp),
        onClick = onClick,
        colors = CardDefaults.cardColors(containerColor = Color.White),
        elevation = CardDefaults.cardElevation(defaultElevation = 4.dp)
    ) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(12.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.Center
        ) {
            Icon(
                imageVector = icon,
                contentDescription = null,
                tint = GuardianBlue,
                modifier = Modifier.size(32.dp)
            )
            Spacer(modifier = Modifier.height(8.dp))
            Text(
                text = title,
                style = MaterialTheme.typography.bodyMedium,
                fontWeight = FontWeight.Medium,
                color = Color.Black
            )
            Text(
                text = subtitle,
                style = MaterialTheme.typography.bodySmall,
                color = Color.Gray
            )
        }
    }
}
