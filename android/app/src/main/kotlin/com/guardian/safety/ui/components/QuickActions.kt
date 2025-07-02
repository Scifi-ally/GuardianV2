package com.guardian.safety.ui.components

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import com.guardian.safety.ui.theme.*

@Composable
fun QuickActions(
    onShareLocation: () -> Unit = {},
    onEmergencyCall: () -> Unit = {},
    onSafetyTutorial: () -> Unit = {},
    onSettings: () -> Unit = {},
    modifier: Modifier = Modifier
) {
    Card(
        modifier = modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(
            containerColor = MaterialTheme.colorScheme.surface
        ),
        shape = RoundedCornerShape(16.dp),
        elevation = CardDefaults.cardElevation(defaultElevation = 4.dp)
    ) {
        Column(
            modifier = Modifier.padding(20.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            Text(
                text = "Quick Actions",
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.Bold
            )
            
            // First row
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                QuickActionCard(
                    icon = Icons.Default.LocationOn,
                    title = "Share Location",
                    subtitle = "Send to contacts",
                    onClick = onShareLocation,
                    modifier = Modifier.weight(1f)
                )
                
                QuickActionCard(
                    icon = Icons.Default.Phone,
                    title = "Emergency Call",
                    subtitle = "Call 911",
                    onClick = onEmergencyCall,
                    modifier = Modifier.weight(1f),
                    isDestructive = true
                )
            }
            
            // Second row
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                QuickActionCard(
                    icon = Icons.Default.School,
                    title = "Safety Tutorial",
                    subtitle = "Learn features",
                    onClick = onSafetyTutorial,
                    modifier = Modifier.weight(1f)
                )
                
                QuickActionCard(
                    icon = Icons.Default.Settings,
                    title = "Settings",
                    subtitle = "Configure app",
                    onClick = onSettings,
                    modifier = Modifier.weight(1f)
                )
            }
        }
    }
}

@Composable
private fun QuickActionCard(
    icon: androidx.compose.ui.graphics.vector.ImageVector,
    title: String,
    subtitle: String,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
    isDestructive: Boolean = false
) {
    Card(
        onClick = onClick,
        modifier = modifier,
        colors = CardDefaults.cardColors(
            containerColor = if (isDestructive) {
                GuardianRed.copy(alpha = 0.1f)
            } else {
                MaterialTheme.colorScheme.surface
            }
        ),
        border = androidx.compose.foundation.BorderStroke(
            1.dp,
            if (isDestructive) {
                GuardianRed.copy(alpha = 0.3f)
            } else {
                MaterialTheme.colorScheme.outline.copy(alpha = 0.2f)
            }
        ),
        shape = RoundedCornerShape(12.dp)
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            Icon(
                imageVector = icon,
                contentDescription = title,
                tint = if (isDestructive) GuardianRed else MaterialTheme.colorScheme.primary,
                modifier = Modifier.size(24.dp)
            )
            
            Text(
                text = title,
                style = MaterialTheme.typography.titleSmall,
                fontWeight = FontWeight.Medium,
                textAlign = TextAlign.Center
            )
            
            Text(
                text = subtitle,
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f),
                textAlign = TextAlign.Center
            )
        }
    }
}

// Standalone emergency actions
@Composable
fun EmergencyQuickActions(
    onSOSPress: () -> Unit = {},
    onShareLocation: () -> Unit = {},
    onEmergencyCall: () -> Unit = {},
    modifier: Modifier = Modifier
) {
    Row(
        modifier = modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        // SOS Button (larger)
        Card(
            onClick = onSOSPress,
            modifier = Modifier.weight(2f),
            colors = CardDefaults.cardColors(
                containerColor = GuardianRed
            ),
            shape = RoundedCornerShape(16.dp)
        ) {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(20.dp),
                horizontalAlignment = Alignment.CenterHorizontally,
                verticalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                Icon(
                    imageVector = Icons.Default.ReportProblem,
                    contentDescription = "SOS",
                    tint = GuardianWhite,
                    modifier = Modifier.size(32.dp)
                )
                
                Text(
                    text = "SOS ALERT",
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.Bold,
                    color = GuardianWhite
                )
                
                Text(
                    text = "Hold for 3 seconds",
                    style = MaterialTheme.typography.bodySmall,
                    color = GuardianWhite.copy(alpha = 0.8f)
                )
            }
        }
        
        // Secondary actions
        Column(
            modifier = Modifier.weight(1f),
            verticalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            Card(
                onClick = onShareLocation,
                colors = CardDefaults.cardColors(
                    containerColor = MaterialTheme.colorScheme.primary
                ),
                shape = RoundedCornerShape(12.dp)
            ) {
                Row(
                    modifier = Modifier.padding(12.dp),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    Icon(
                        imageVector = Icons.Default.LocationOn,
                        contentDescription = "Share Location",
                        tint = GuardianWhite,
                        modifier = Modifier.size(20.dp)
                    )
                    Text(
                        text = "Share",
                        style = MaterialTheme.typography.bodyMedium,
                        fontWeight = FontWeight.Medium,
                        color = GuardianWhite
                    )
                }
            }
            
            Card(
                onClick = onEmergencyCall,
                colors = CardDefaults.cardColors(
                    containerColor = GuardianYellow
                ),
                shape = RoundedCornerShape(12.dp)
            ) {
                Row(
                    modifier = Modifier.padding(12.dp),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    Icon(
                        imageVector = Icons.Default.Phone,
                        contentDescription = "Emergency Call",
                        tint = GuardianWhite,
                        modifier = Modifier.size(20.dp)
                    )
                    Text(
                        text = "Call",
                        style = MaterialTheme.typography.bodyMedium,
                        fontWeight = FontWeight.Medium,
                        color = GuardianWhite
                    )
                }
            }
        }
    }
}
