package com.guardian.safety.ui.screens.guardian

import androidx.compose.foundation.layout.*
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.navigation.NavHostController
import com.guardian.safety.ui.components.BottomNavigation
import com.guardian.safety.ui.theme.*

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun GuardianScreen(navController: NavHostController) {
    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Guardian Network") },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = GuardianBlue,
                    titleContentColor = GuardianWhite
                )
            )
        },
        bottomBar = {
            BottomNavigation(
                navController = navController,
                onSOSPress = { /* Handle SOS */ }
            )
        }
    ) { paddingValues ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
                .padding(16.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.Center
        ) {
            Icon(
                imageVector = Icons.Default.People,
                contentDescription = "Guardian Network",
                modifier = Modifier.size(64.dp),
                tint = GuardianBlue
            )
            
            Spacer(modifier = Modifier.height(16.dp))
            
            Text(
                text = "Guardian Network",
                style = MaterialTheme.typography.headlineMedium.copy(
                    fontWeight = FontWeight.Bold
                )
            )
            
            Text(
                text = "Connect with your safety network",
                style = MaterialTheme.typography.bodyLarge,
                color = GuardianGray600
            )
        }
    }
}
