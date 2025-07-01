package com.guardian.safety.presentation.screens.navigation

import androidx.compose.foundation.layout.*
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Navigation
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.navigation.NavController
import com.guardian.safety.presentation.components.MagicNavbar
import com.guardian.safety.ui.theme.GuardianBlue

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun NavigationScreen(
    navController: NavController
) {
    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Navigation") },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = Color.White,
                    titleContentColor = Color.Black
                )
            )
        },
        bottomBar = {
            MagicNavbar(
                currentRoute = "navigation",
                onNavigate = { route -> navController.navigate(route) }
            )
        }
    ) { paddingValues ->
        Box(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues),
            contentAlignment = Alignment.Center
        ) {
            Card(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(24.dp),
                colors = CardDefaults.cardColors(
                    containerColor = GuardianBlue.copy(alpha = 0.1f)
                )
            ) {
                Column(
                    modifier = Modifier.padding(32.dp),
                    horizontalAlignment = Alignment.CenterHorizontally
                ) {
                    Icon(
                        imageVector = Icons.Default.Navigation,
                        contentDescription = "Navigation",
                        modifier = Modifier.size(64.dp),
                        tint = GuardianBlue
                    )
                    Spacer(modifier = Modifier.height(16.dp))
                    Text(
                        text = "Navigation",
                        style = MaterialTheme.typography.headlineSmall,
                        fontWeight = FontWeight.Bold,
                        color = GuardianBlue
                    )
                    Spacer(modifier = Modifier.height(8.dp))
                    Text(
                        text = "Turn-by-turn navigation to emergency contacts will be available here.",
                        style = MaterialTheme.typography.bodyMedium,
                        color = Color.Gray
                    )
                }
            }
        }
    }
}
