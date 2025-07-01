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

        // Slide Up Panel - matching web app tabs
        SlideUpPanel(
            modifier = Modifier.align(Alignment.BottomCenter),
            selectedTab = uiState.selectedTab,
            onTabSelected = viewModel::setSelectedTab,
            isNavigating = uiState.isNavigating,
            onEndNavigation = viewModel::clearRoute
        )

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
