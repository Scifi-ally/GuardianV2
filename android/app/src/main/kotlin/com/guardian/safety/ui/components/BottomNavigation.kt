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
import com.guardian.safety.ui.navigation.Screen
import com.guardian.safety.ui.theme.*

@Composable
fun BottomNavigation(
    navController: NavHostController,
    onSOSPress: () -> Unit
) {
    // Enhanced SOS pulse animation matching web app
    val infiniteTransition = rememberInfiniteTransition(label = "SOS Pulse")
    val sosScale by infiniteTransition.animateFloat(
        initialValue = 1f,
        targetValue = 1.1f,
        animationSpec = infiniteRepeatable(
            animation = tween(1000, easing = EaseInOutCubic),
            repeatMode = RepeatMode.Reverse
        ),
        label = "SOS Scale"
    )

    // SOS glow effect
    val sosGlow by infiniteTransition.animateFloat(
        initialValue = 0.3f,
        targetValue = 0.8f,
        animationSpec = infiniteRepeatable(
            animation = tween(1500, easing = EaseInOutSine),
            repeatMode = RepeatMode.Reverse
        ),
        label = "SOS Glow"
    )

    Card(
        modifier = Modifier
            .fillMaxWidth()
            .height(80.dp),
        shape = RoundedCornerShape(topStart = 24.dp, topEnd = 24.dp),
        colors = CardDefaults.cardColors(
            containerColor = MaterialTheme.colorScheme.surface.copy(alpha = 0.95f)
        ),
        elevation = CardDefaults.cardElevation(defaultElevation = 16.dp)
    ) {
        Row(
            modifier = Modifier
                .fillMaxSize()
                .padding(horizontal = 24.dp, vertical = 12.dp),
            horizontalArrangement = Arrangement.SpaceEvenly,
            verticalAlignment = Alignment.CenterVertically
        ) {
            // Navigation items matching web app
            NavItem(
                icon = Icons.Default.Home,
                label = "Home",
                onClick = { navController.navigate(Screen.Index.route) }
            )

            NavItem(
                icon = Icons.Default.People,
                label = "Guardian",
                onClick = { navController.navigate(Screen.Guardian.route) }
            )

            // SOS Button - center piece like web app with enhanced animation
            Box(
                modifier = Modifier
                    .size(64.dp)
                    .scale(sosScale),
                contentAlignment = Alignment.Center
            ) {
                // Glow effect background
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
                    modifier = Modifier.size(56.dp),
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
                        imageVector = Icons.Default.Emergency,
                        contentDescription = "SOS",
                        tint = GuardianWhite,
                        modifier = Modifier.size(20.dp)
                    )
                    Text(
                        text = "SOS",
                        fontSize = 8.sp,
                        fontWeight = FontWeight.Bold,
                        color = GuardianWhite
                    )
                }
            }

            NavItem(
                icon = Icons.Default.Contacts,
                label = "Contacts",
                onClick = { navController.navigate(Screen.Contacts.route) }
            )

            NavItem(
                icon = Icons.Default.Person,
                label = "Profile",
                onClick = { navController.navigate(Screen.Profile.route) }
            )
        }
    }
}

@Composable
private fun NavItem(
    icon: ImageVector,
    label: String,
    onClick: () -> Unit
) {
    val interactionSource = remember { MutableInteractionSource() }
    val isPressed by interactionSource.collectIsPressedAsState()
    val navScale by animateFloatAsState(
        targetValue = if (isPressed) 0.9f else 1f,
        animationSpec = tween(100),
        label = "NavItemScale"
    )

    IconButton(
        onClick = onClick,
        modifier = Modifier
            .size(48.dp)
            .scale(navScale),
        interactionSource = interactionSource
    ) {
        Column(
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.Center
        ) {
            Icon(
                imageVector = icon,
                contentDescription = label,
                tint = GuardianGray600,
                modifier = Modifier.size(20.dp)
            )
            Text(
                text = label,
                fontSize = 8.sp,
                color = GuardianGray600
            )
        }
    }
}
