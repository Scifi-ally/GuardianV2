package com.guardian.safety.ui.screens.dashboard

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
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
import androidx.compose.ui.unit.sp
import androidx.navigation.NavHostController
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.guardian.safety.ui.components.BottomNavigation
import com.guardian.safety.ui.components.RealGoogleMap
import com.guardian.safety.ui.components.SlideUpPanel
import com.guardian.safety.ui.components.RouteSearchSection
import com.guardian.safety.ui.components.EnhancedSOSButton
import com.guardian.safety.ui.viewmodel.IndexViewModel
import com.guardian.safety.services.EmergencyType
import com.guardian.safety.ui.theme.*

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun IndexScreen(
    navController: NavHostController,
    viewModel: IndexViewModel = hiltViewModel()
) {
    val uiState by viewModel.uiState.collectAsStateWithLifecycle()
    val userLocation by viewModel.userLocation.collectAsStateWithLifecycle()
    val emergencyContacts by viewModel.emergencyContacts.collectAsStateWithLifecycle()

    Box(modifier = Modifier.fillMaxSize()) {
        // Real Google Maps - matching web app layout
        Box(
            modifier = Modifier
                .fillMaxSize()
                .padding(top = 120.dp, bottom = 120.dp) // Space for top controls and bottom nav
        ) {
            RealGoogleMap(
                modifier = Modifier.fillMaxSize(),
                userLocation = userLocation,
                destination = uiState.destination,
                travelMode = uiState.travelMode,
                isNavigating = uiState.isNavigating,
                onMapClick = { latLng ->
                    viewModel.setDestination(latLng)
                },
                emergencyServices = uiState.nearbyEmergencyServices,
                safeZones = uiState.nearbySafeZones
            )
        }

        // Top Search Section - matching web app compact design
        Surface(
            modifier = Modifier
                .fillMaxWidth()
                .padding(top = 40.dp), // Account for status bar
            color = MaterialTheme.colorScheme.surface.copy(alpha = 0.95f),
            shadowElevation = 4.dp
        ) {
            RouteSearchSection(
                fromLocation = uiState.fromLocation,
                toLocation = uiState.toLocation,
                onFromLocationChange = viewModel::setFromLocation,
                onToLocationChange = viewModel::setToLocation,
                onSearch = viewModel::startNavigation,
                onClear = viewModel::clearRoute,
                travelMode = uiState.travelMode,
                onTravelModeChange = viewModel::setTravelMode
            )
        }

        // Slide Up Panel - exactly matching web app
        SlideUpPanel(
            modifier = Modifier.align(Alignment.BottomCenter),
            bottomOffset = 120f // Account for bottom navigation
        ) {
            // Panel content matching web app structure
            Column(
                modifier = Modifier.fillMaxWidth(),
                verticalArrangement = Arrangement.spacedBy(16.dp)
            ) {
                // Enhanced SOS Button in panel like web app
                Box(
                    modifier = Modifier.align(Alignment.CenterHorizontally)
                ) {
                    EnhancedSOSButton(
                        onEmergencyTrigger = { alertId ->
                            viewModel.triggerSOS(EmergencyType.GENERAL)
                        },
                        size = "md"
                    )
                }

                // Route information if navigating
                if (uiState.isNavigating) {
                    Card(
                        modifier = Modifier.fillMaxWidth(),
                        colors = CardDefaults.cardColors(
                            containerColor = MaterialTheme.colorScheme.primary.copy(alpha = 0.05f)
                        )
                    ) {
                        Column(
                            modifier = Modifier.padding(16.dp)
                        ) {
                            Text(
                                text = "Turn-by-Turn Navigation",
                                style = MaterialTheme.typography.titleMedium,
                                fontWeight = FontWeight.Bold
                            )
                            if (uiState.fromLocation.isNotEmpty() && uiState.toLocation.isNotEmpty()) {
                                Text(
                                    text = "${uiState.fromLocation} → ${uiState.toLocation}",
                                    style = MaterialTheme.typography.bodyMedium,
                                    color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.7f)
                                )
                            }
                        }
                    }
                }

                // Quick actions matching web app
                Text(
                    text = "Quick Actions",
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.Bold
                )

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    Card(
                        modifier = Modifier.weight(1f),
                        onClick = { /* Share location */ }
                    ) {
                        Column(
                            modifier = Modifier.padding(16.dp),
                            horizontalAlignment = Alignment.CenterHorizontally
                        ) {
                            Icon(
                                imageVector = Icons.Default.LocationOn,
                                contentDescription = "Share Location",
                                tint = MaterialTheme.colorScheme.primary
                            )
                            Text(
                                text = "Share Location",
                                style = MaterialTheme.typography.bodySmall,
                                textAlign = androidx.compose.ui.text.style.TextAlign.Center
                            )
                        }
                    }

                    Card(
                        modifier = Modifier.weight(1f),
                        onClick = { /* Call emergency */ }
                    ) {
                        Column(
                            modifier = Modifier.padding(16.dp),
                            horizontalAlignment = Alignment.CenterHorizontally
                        ) {
                            Icon(
                                imageVector = Icons.Default.Phone,
                                contentDescription = "Emergency Call",
                                tint = GuardianRed
                            )
                            Text(
                                text = "Emergency Call",
                                style = MaterialTheme.typography.bodySmall,
                                textAlign = androidx.compose.ui.text.style.TextAlign.Center
                            )
                        }
                    }
                }
            }
        }

        // Bottom Navigation - matching MagicNavbar
        Box(
            modifier = Modifier
                .align(Alignment.BottomCenter)
                .padding(16.dp)
        ) {
            BottomNavigation(
                navController = navController,
                onSOSPress = {
                    viewModel.triggerSOS(EmergencyType.GENERAL)
                }
            )
        }
    }
}
