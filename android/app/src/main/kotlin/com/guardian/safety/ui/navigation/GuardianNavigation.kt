package com.guardian.safety.ui.navigation

import androidx.compose.animation.*
import androidx.compose.animation.core.*
import androidx.compose.runtime.*
import androidx.navigation.NavHostController
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.guardian.safety.ui.viewmodel.AuthViewModel
import com.guardian.safety.ui.viewmodel.AuthState
import com.guardian.safety.ui.screens.auth.SignInScreen
import com.guardian.safety.ui.screens.auth.SignUpScreen
import com.guardian.safety.ui.screens.dashboard.IndexScreen
import com.guardian.safety.ui.screens.contacts.ContactsScreen
import com.guardian.safety.ui.screens.navigation.NavigationScreen
import com.guardian.safety.ui.screens.profile.ProfileScreen
import com.guardian.safety.ui.screens.profile.EnhancedProfileScreen
import com.guardian.safety.ui.screens.settings.SettingsScreen
import com.guardian.safety.ui.screens.guardian.GuardianScreen
import com.guardian.safety.ui.screens.guardian.EnhancedGuardianScreen

sealed class Screen(val route: String) {
    object SignIn : Screen("signin")
    object SignUp : Screen("signup")
    object Index : Screen("index")
    object Guardian : Screen("guardian")
    object Contacts : Screen("contacts")
    object Navigation : Screen("navigation")
    object Profile : Screen("profile")
    object Settings : Screen("settings")
}

@Composable
fun GuardianNavigation(
    navController: NavHostController,
    authViewModel: AuthViewModel = hiltViewModel()
) {
    val authState by authViewModel.authState.collectAsStateWithLifecycle()

    // Handle authentication state changes
    LaunchedEffect(authState) {
        when (authState) {
            is AuthState.Authenticated -> {
                // Navigate to main app if on auth screens
                val currentRoute = navController.currentDestination?.route
                if (currentRoute == Screen.SignIn.route || currentRoute == Screen.SignUp.route) {
                    navController.navigate(Screen.Index.route) {
                        popUpTo(navController.graph.startDestinationId) { inclusive = true }
                    }
                }
            }
            is AuthState.Unauthenticated -> {
                // Navigate to sign in if not on auth screens
                val currentRoute = navController.currentDestination?.route
                if (currentRoute != Screen.SignIn.route && currentRoute != Screen.SignUp.route) {
                    navController.navigate(Screen.SignIn.route) {
                        popUpTo(navController.graph.startDestinationId) { inclusive = true }
                    }
                }
            }
            else -> { /* Handle loading state */ }
        }
    }

    val startDestination = when (authState) {
        is AuthState.Authenticated -> Screen.Index.route
        else -> Screen.SignIn.route
    }

    NavHost(
        navController = navController,
        startDestination = startDestination,
        enterTransition = {
            fadeIn(
                animationSpec = tween(200, easing = EaseInOut)
            ) + scaleIn(
                initialScale = 0.98f,
                animationSpec = tween(200, easing = EaseInOut)
            )
        },
        exitTransition = {
            fadeOut(
                animationSpec = tween(200, easing = EaseInOut)
            ) + scaleOut(
                targetScale = 1.02f,
                animationSpec = tween(200, easing = EaseInOut)
            )
        }
    ) {
        // Authentication screens
        composable(Screen.SignIn.route) {
            SignInScreen(
                onNavigateToSignUp = {
                    navController.navigate(Screen.SignUp.route)
                },
                onSignInSuccess = {
                    navController.navigate(Screen.Index.route) {
                        popUpTo(Screen.SignIn.route) { inclusive = true }
                    }
                }
            )
        }

        composable(Screen.SignUp.route) {
            SignUpScreen(
                onNavigateToSignIn = {
                    navController.navigate(Screen.SignIn.route)
                },
                onSignUpSuccess = {
                    navController.navigate(Screen.Index.route) {
                        popUpTo(Screen.SignUp.route) { inclusive = true }
                    }
                }
            )
        }

        // Main app screens (protected routes)
        composable(Screen.Index.route) {
            IndexScreen(navController = navController)
        }

        composable(Screen.Guardian.route) {
            GuardianScreen(navController = navController)
        }

        composable(Screen.Contacts.route) {
            ContactsScreen(navController = navController)
        }

        composable(Screen.Navigation.route) {
            NavigationScreen(navController = navController)
        }

        composable(Screen.Profile.route) {
            EnhancedProfileScreen(navController = navController)
        }

        composable(Screen.Settings.route) {
            SettingsScreen(navController = navController)
        }
    }
}
