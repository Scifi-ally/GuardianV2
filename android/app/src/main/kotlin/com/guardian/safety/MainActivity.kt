package com.guardian.safety

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Surface
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.ui.Modifier
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import com.google.accompanist.systemuicontroller.rememberSystemUiController
import com.guardian.safety.presentation.screens.auth.AuthScreen
import com.guardian.safety.presentation.screens.contacts.ContactsScreen
import com.guardian.safety.presentation.screens.guardian.GuardianScreen
import com.guardian.safety.presentation.screens.map.MapScreen
import com.guardian.safety.presentation.screens.navigation.NavigationScreen
import com.guardian.safety.presentation.screens.profile.ProfileScreen
import com.guardian.safety.presentation.screens.settings.SettingsScreen
import com.guardian.safety.presentation.viewmodels.AuthViewModel
import com.guardian.safety.ui.theme.GuardianTheme

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()

        setContent {
            GuardianTheme {
                GuardianApp()
            }
        }
    }
}

@Composable
fun GuardianApp() {
    val systemUiController = rememberSystemUiController()
    val navController = rememberNavController()
    val authViewModel: AuthViewModel = viewModel()

    LaunchedEffect(Unit) {
        systemUiController.setStatusBarColor(
            color = MaterialTheme.colorScheme.surface,
            darkIcons = true
        )
    }

    Surface(
        modifier = Modifier.fillMaxSize(),
        color = MaterialTheme.colorScheme.background
    ) {
        NavHost(
            navController = navController,
            startDestination = if (authViewModel.isAuthenticated) "guardian" else "auth"
        ) {
            composable("auth") {
                AuthScreen(
                    onNavigateToMain = {
                        navController.navigate("guardian") {
                            popUpTo("auth") { inclusive = true }
                        }
                    }
                )
            }

            composable("guardian") {
                GuardianScreen(navController = navController)
            }

            composable("map") {
                MapScreen(navController = navController)
            }

            composable("contacts") {
                ContactsScreen(navController = navController)
            }

            composable("navigation") {
                NavigationScreen(navController = navController)
            }

            composable("profile") {
                ProfileScreen(navController = navController)
            }

            composable("settings") {
                SettingsScreen(navController = navController)
            }
        }
    }
}
