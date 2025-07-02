package com.guardian.safety.ui.components

import androidx.compose.animation.core.*
import androidx.compose.foundation.background
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.interaction.collectIsPressedAsState
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
import androidx.compose.ui.draw.scale
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.navigation.NavHostController
import androidx.navigation.compose.currentBackStackEntryAsState
import com.guardian.safety.ui.navigation.Screen
import com.guardian.safety.ui.theme.*

// Exact 3-tab navigation matching web app MagicNavbar
@Composable
fun BottomNavigation(
    navController: NavHostController,
    onSOSPress: () -> Unit
) {
    val navBackStackEntry by navController.currentBackStackEntryAsState()
    val currentRoute = navBackStackEntry?.destination?.route

    // SOS pulse animation matching web app exactly
    val infiniteTransition = rememberInfiniteTransition(label = "SOS Pulse")
    val sosScale by infiniteTransition.animateFloat(
        initialValue = 1f,
        targetValue = 1.25f,
        animationSpec = infiniteRepeatable(
            animation = tween(1000, easing = EaseInOutCubic),
            repeatMode = RepeatMode.Reverse
        ),
        label = "SOS Scale"
    )

    val sosGlow by infiniteTransition.animateFloat(
        initialValue = 0.3f,
        targetValue = 0.8f,
        animationSpec = infiniteRepeatable(
            animation = tween(1500, easing = EaseInOutSine),
            repeatMode = RepeatMode.Reverse
        ),
        label = "SOS Glow"
    )

    // Exact web app navigation structure: Map, SOS, Profile
    Box(
        modifier = Modifier
            .fillMaxWidth()
            .background(MaterialTheme.colorScheme.background.copy(alpha = 0.8f))
            .padding(horizontal = 16.dp, vertical = 12.dp)
    ) {
        // Background blur effect
        Card(
            modifier = Modifier.fillMaxWidth(),
            shape = RoundedCornerShape(24.dp),
            colors = CardDefaults.cardColors(
                containerColor = MaterialTheme.colorScheme.surface.copy(alpha = 0.95f)
            ),
            elevation = CardDefaults.cardElevation(defaultElevation = 16.dp)
        ) {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 16.dp, vertical = 12.dp),
                horizontalArrangement = Arrangement.SpaceAround,
                verticalAlignment = Alignment.CenterVertically
            ) {
                // Map Tab - using exact web app icon
                NavItem(
                    icon = Icons.Default.LocationOn, // MapPin equivalent
                    label = "Map",
                    isActive = currentRoute == Screen.Index.route,
                    onClick = { navController.navigate(Screen.Index.route) }
                )

                // SOS Button - Center (matching web app exactly)
                Box(
                    modifier = Modifier.scale(sosScale),
                    contentAlignment = Alignment.Center
                ) {
                    // Multiple glow layers matching web app
                    Box(
                        modifier = Modifier
                            .size(72.dp)
                            .background(
                                GuardianRed.copy(alpha = sosGlow * 0.1f),
                                CircleShape
                            )
                    )
                    Box(
                        modifier = Modifier
                            .size(64.dp)
                            .background(
                                GuardianRed.copy(alpha = sosGlow * 0.2f),
                                CircleShape
                            )
                    )
                    Box(
                        modifier = Modifier
                            .size(56.dp)
                            .background(
                                GuardianRed.copy(alpha = sosGlow * 0.3f),
                                CircleShape
                            )
                    )

                    Button(
                        onClick = onSOSPress,
                        modifier = Modifier.size(48.dp),
                        colors = ButtonDefaults.buttonColors(
                            containerColor = GuardianRed
                        ),
                        shape = CircleShape,
                        contentPadding = PaddingValues(0.dp)
                    ) {
                        Column(
                            horizontalAlignment = Alignment.CenterHorizontally,
                            verticalArrangement = Arrangement.Center
                        ) {
                            Icon(
                                imageVector = Icons.Default.ReportProblem, // AlertTriangle equivalent
                                contentDescription = "SOS",
                                tint = GuardianWhite,
                                modifier = Modifier.size(18.dp)
                            )
                            Text(
                                text = "SOS",
                                fontSize = 7.sp,
                                fontWeight = FontWeight.Bold,
                                color = GuardianWhite
                            )
                        }
                    }
                }

                // Profile Tab - using exact web app icon
                NavItem(
                    icon = Icons.Default.Person, // User equivalent
                    label = "Profile",
                    isActive = currentRoute == Screen.Profile.route,
                    onClick = { navController.navigate(Screen.Profile.route) }
                )
            }
        }
    }
}

@Composable
private fun NavItem(
    icon: ImageVector,
    label: String,
    isActive: Boolean,
    onClick: () -> Unit
) {
    val interactionSource = remember { MutableInteractionSource() }
    val isPressed by interactionSource.collectIsPressedAsState()

    val navScale by animateFloatAsState(
        targetValue = if (isPressed) 0.95f else 1f,
        animationSpec = tween(100),
        label = "NavItemScale"
    )

    Column(
        horizontalAlignment = Alignment.CenterHorizontally,
        modifier = Modifier
            .scale(navScale)
            .padding(8.dp)
    ) {
        // Background circle for active items
        Box(
            modifier = Modifier
                .size(48.dp)
                .background(
                    if (isActive) MaterialTheme.colorScheme.primary.copy(alpha = 0.1f) else androidx.compose.ui.graphics.Color.Transparent,
                    CircleShape
                ),
            contentAlignment = Alignment.Center
        ) {
            IconButton(
                onClick = onClick,
                modifier = Modifier.size(48.dp),
                interactionSource = interactionSource
            ) {
                Icon(
                    imageVector = icon,
                    contentDescription = label,
                    tint = if (isActive) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f),
                    modifier = Modifier.size(20.dp)
                )
            }
        }

        Spacer(modifier = Modifier.height(2.dp))

        Text(
            text = label,
            fontSize = 9.sp,
            fontWeight = if (isActive) FontWeight.Medium else FontWeight.Normal,
            color = if (isActive) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f)
        )
    }
}
