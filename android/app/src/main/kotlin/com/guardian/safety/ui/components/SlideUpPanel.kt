package com.guardian.safety.ui.components

import androidx.compose.animation.core.*
import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.slideInHorizontally
import androidx.compose.animation.fadeIn
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.interaction.collectIsPressedAsState
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.lazy.itemsIndexed
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.scale
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.guardian.safety.ui.theme.*
import com.guardian.safety.data.model.RouteStep
import kotlinx.coroutines.delay

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun SlideUpPanel(
    modifier: Modifier = Modifier,
    selectedTab: String,
    onTabSelected: (String) -> Unit,
    isNavigating: Boolean,
    onEndNavigation: () -> Unit,
    routeSteps: List<RouteStep> = emptyList(),
    routeSummary: String = ""
) {
    Surface(
        modifier = modifier
            .fillMaxWidth()
            .height(350.dp),
        shape = RoundedCornerShape(topStart = 24.dp, topEnd = 24.dp),
        color = MaterialTheme.colorScheme.surface.copy(alpha = 0.95f),
        shadowElevation = 8.dp
    ) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(16.dp)
        ) {
            // Tab Row
            TabRow(
                selectedTabIndex = if (selectedTab == "navigation") 0 else 1,
                containerColor = MaterialTheme.colorScheme.surface,
                contentColor = GuardianBlue,
                indicator = { tabPositions ->
                    TabRowDefaults.PrimaryIndicator(
                        modifier = Modifier,
                        color = GuardianBlue
                    )
                }
            ) {
                Tab(
                    selected = selectedTab == "navigation",
                    onClick = { onTabSelected("navigation") }
                ) {
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        modifier = Modifier.padding(12.dp)
                    ) {
                        Icon(
                            imageVector = Icons.Default.Navigation,
                            contentDescription = "Routes",
                            modifier = Modifier.size(16.dp)
                        )
                        Spacer(modifier = Modifier.width(4.dp))
                        Text(
                            text = "Routes",
                            fontSize = 12.sp
                        )
                    }
                }

                Tab(
                    selected = selectedTab == "settings",
                    onClick = { onTabSelected("settings") }
                ) {
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        modifier = Modifier.padding(12.dp)
                    ) {
                        Icon(
                            imageVector = Icons.Default.Settings,
                            contentDescription = "Settings",
                            modifier = Modifier.size(16.dp)
                        )
                        Spacer(modifier = Modifier.width(4.dp))
                        Text(
                            text = "Settings",
                            fontSize = 12.sp
                        )
                    }
                }
            }

            Spacer(modifier = Modifier.height(16.dp))

            // Tab Content
            when (selectedTab) {
                "navigation" -> NavigationTabContent(
                    isNavigating = isNavigating,
                    onEndNavigation = onEndNavigation,
                    routeSteps = routeSteps,
                    routeSummary = routeSummary
                )
                "settings" -> SettingsTabContent()
            }
        }
    }
}

@Composable
private fun NavigationTabContent(
    isNavigating: Boolean,
    onEndNavigation: () -> Unit,
    routeSteps: List<RouteStep> = emptyList(),
    routeSummary: String = ""
) {
    if (isNavigating) {
        // Navigation Instructions
        Column {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = "Turn-by-Turn Navigation",
                    style = MaterialTheme.typography.titleMedium.copy(
                        fontWeight = FontWeight.Bold
                    )
                )
                Badge(
                    containerColor = GuardianBlue.copy(alpha = 0.2f),
                    contentColor = GuardianBlue
                ) {
                    Text("Active", fontSize = 10.sp)
                }
            }

            Spacer(modifier = Modifier.height(16.dp))

            // Real navigation steps from routing data
            val navigationSteps = routeSteps.map { step ->
                "${step.instruction} (${step.distance})"
            }

            LazyColumn(
                verticalArrangement = Arrangement.spacedBy(8.dp),
                modifier = Modifier.weight(1f)
            ) {
                itemsIndexed(navigationSteps) { index, step ->
                    var visible by remember { mutableStateOf(false) }

                    LaunchedEffect(Unit) {
                        kotlinx.coroutines.delay(index * 100L) // Staggered animation
                        visible = true
                    }

                    AnimatedVisibility(
                        visible = visible,
                        enter = slideInHorizontally(
                            initialOffsetX = { -it },
                            animationSpec = tween(300, easing = EaseOutCubic)
                        ) + fadeIn(
                            animationSpec = tween(300)
                        )
                    ) {
                        NavigationStepCard(
                            step = step,
                            isActive = index == 0
                        )
                    }
                }
            }

            Spacer(modifier = Modifier.height(16.dp))

            Button(
                onClick = onEndNavigation,
                modifier = Modifier.fillMaxWidth(),
                colors = ButtonDefaults.outlinedButtonColors()
            ) {
                Text("End Navigation")
            }
        }
    } else {
        // Route Planning
        Column {
            Text(
                text = "Route Planning",
                style = MaterialTheme.typography.titleMedium.copy(
                    fontWeight = FontWeight.Bold
                )
            )

            Spacer(modifier = Modifier.height(16.dp))

            Row(
                horizontalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                OutlinedButton(
                    onClick = { /* Share location */ },
                    modifier = Modifier.weight(1f)
                ) {
                    Column(
                        horizontalAlignment = Alignment.CenterHorizontally,
                        verticalArrangement = Arrangement.spacedBy(4.dp)
                    ) {
                        Icon(
                            imageVector = Icons.Default.Share,
                            contentDescription = "Share Location",
                            modifier = Modifier.size(16.dp)
                        )
                        Text("Share Location", fontSize = 10.sp)
                    }
                }

                OutlinedButton(
                    onClick = { /* Live tracking */ },
                    modifier = Modifier.weight(1f)
                ) {
                    Column(
                        horizontalAlignment = Alignment.CenterHorizontally,
                        verticalArrangement = Arrangement.spacedBy(4.dp)
                    ) {
                        Icon(
                            imageVector = Icons.Default.Navigation,
                            contentDescription = "Live Tracking",
                            modifier = Modifier.size(16.dp)
                        )
                        Text("Live Tracking", fontSize = 10.sp)
                    }
                }
            }
        }
    }
}

@Composable
private fun SettingsTabContent() {
    LazyColumn(
        verticalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        item {
            Text(
                text = "Map Display",
                style = MaterialTheme.typography.titleSmall.copy(
                    fontWeight = FontWeight.Medium
                )
            )
        }

        item {
            SettingsCard(
                title = "Show Traffic",
                description = "Display real-time traffic conditions",
                checked = true,
                onCheckedChange = { }
            )
        }

        item {
            SettingsCard(
                title = "Show Safe Zones",
                description = "Display nearby safe areas and police stations",
                checked = true,
                onCheckedChange = { }
            )
        }

        item {
            SettingsCard(
                title = "Emergency Services",
                description = "Show hospitals and emergency services",
                checked = true,
                onCheckedChange = { }
            )
        }

        item {
            Text(
                text = "Route Preferences",
                style = MaterialTheme.typography.titleSmall.copy(
                    fontWeight = FontWeight.Medium
                )
            )
        }

        item {
            SettingsCard(
                title = "Prefer well-lit paths",
                description = "Choose routes with better lighting",
                checked = true,
                onCheckedChange = { }
            )
        }

        item {
            SettingsCard(
                title = "Avoid isolated areas",
                description = "Stay in populated areas when possible",
                checked = true,
                onCheckedChange = { }
            )
        }
    }
}

@Composable
private fun NavigationStepCard(
    step: String,
    isActive: Boolean = false
) {
    val cardScale by animateFloatAsState(
        targetValue = if (isActive) 1.02f else 1f,
        animationSpec = tween(300),
        label = "CardScale"
    )

    Card(
        modifier = Modifier
            .fillMaxWidth()
            .scale(cardScale),
        colors = CardDefaults.cardColors(
            containerColor = if (isActive) {
                GuardianBlue.copy(alpha = 0.05f)
            } else {
                GuardianGray50
            }
        ),
        border = if (isActive) {
            androidx.compose.foundation.BorderStroke(
                1.dp,
                GuardianBlue.copy(alpha = 0.3f)
            )
        } else null
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(12.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Icon(
                imageVector = Icons.Default.ArrowForward,
                contentDescription = null,
                modifier = Modifier.size(16.dp),
                tint = GuardianBlue
            )
            Spacer(modifier = Modifier.width(8.dp))
            Text(
                text = step,
                style = MaterialTheme.typography.bodyMedium
            )
        }
    }
}

@Composable
private fun SettingsCard(
    title: String,
    description: String,
    checked: Boolean,
    onCheckedChange: (Boolean) -> Unit
) {
    val interactionSource = remember { MutableInteractionSource() }
    val isPressed by interactionSource.collectIsPressedAsState()
    val cardScale by animateFloatAsState(
        targetValue = if (isPressed) 1.02f else 1f,
        animationSpec = tween(200),
        label = "SettingsCardScale"
    )

    Card(
        modifier = Modifier
            .fillMaxWidth()
            .scale(cardScale),
        colors = CardDefaults.cardColors(
            containerColor = GuardianGray50
        )
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(12.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Column(modifier = Modifier.weight(1f)) {
                Text(
                    text = title,
                    style = MaterialTheme.typography.bodyMedium.copy(
                        fontWeight = FontWeight.Medium
                    )
                )
                Text(
                    text = description,
                    style = MaterialTheme.typography.bodySmall,
                    color = GuardianGray600
                )
            }
            Switch(
                checked = checked,
                onCheckedChange = onCheckedChange,
                colors = SwitchDefaults.colors(
                    checkedThumbColor = GuardianWhite,
                    checkedTrackColor = GuardianBlue
                )
            )
        }
    }
}
