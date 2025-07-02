package com.guardian.safety.ui.components

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.guardian.safety.ui.theme.*

data class UserStats(
    val emergencyAlertsSent: Int = 0,
    val locationSharesSent: Int = 0,
    val emergencyContactsAdded: Int = 0,
    val safetyTutorialCompleted: Boolean = false,
    val lastActiveDate: String = "",
    val averageResponseTime: String = "N/A",
    val totalAppUsageTime: String = "0 hours"
)

@Composable
fun UserStatsManager(
    modifier: Modifier = Modifier
) {
    var stats by remember {
        mutableStateOf(
            UserStats(
                emergencyAlertsSent = 3,
                locationSharesSent = 12,
                emergencyContactsAdded = 5,
                safetyTutorialCompleted = true,
                lastActiveDate = "Today",
                averageResponseTime = "1.2 seconds",
                totalAppUsageTime = "24 hours"
            )
        )
    }
    
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
            verticalArrangement = Arrangement.spacedBy(20.dp)
        ) {
            // Header
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = "Your Safety Stats",
                    style = MaterialTheme.typography.titleLarge,
                    fontWeight = FontWeight.Bold
                )
                
                IconButton(onClick = { /* Refresh stats */ }) {
                    Icon(
                        imageVector = Icons.Default.Refresh,
                        contentDescription = "Refresh",
                        tint = MaterialTheme.colorScheme.primary
                    )
                }
            }
            
            // Stats Grid
            Column(
                verticalArrangement = Arrangement.spacedBy(16.dp)
            ) {
                // First row
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    StatCard(
                        title = "SOS Alerts",
                        value = stats.emergencyAlertsSent.toString(),
                        icon = Icons.Default.Warning,
                        color = GuardianRed,
                        modifier = Modifier.weight(1f)
                    )
                    
                    StatCard(
                        title = "Contacts",
                        value = stats.emergencyContactsAdded.toString(),
                        icon = Icons.Default.People,
                        color = MaterialTheme.colorScheme.primary,
                        modifier = Modifier.weight(1f)
                    )
                }
                
                // Second row
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    StatCard(
                        title = "Location Shares",
                        value = stats.locationSharesSent.toString(),
                        icon = Icons.Default.LocationOn,
                        color = GuardianGreen,
                        modifier = Modifier.weight(1f)
                    )
                    
                    StatCard(
                        title = "Response Time",
                        value = stats.averageResponseTime,
                        icon = Icons.Default.Speed,
                        color = GuardianYellow,
                        modifier = Modifier.weight(1f)
                    )
                }
            }
            
            Divider()
            
            // Detailed Stats
            Column(
                verticalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                Text(
                    text = "Activity Details",
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.Bold
                )
                
                DetailStatItem(
                    icon = Icons.Default.AccessTime,
                    title = "Total App Usage",
                    value = stats.totalAppUsageTime
                )
                
                DetailStatItem(
                    icon = Icons.Default.Today,
                    title = "Last Active",
                    value = stats.lastActiveDate
                )
                
                DetailStatItem(
                    icon = Icons.Default.School,
                    title = "Safety Tutorial",
                    value = if (stats.safetyTutorialCompleted) "Completed" else "Not Started",
                    valueColor = if (stats.safetyTutorialCompleted) GuardianGreen else GuardianYellow
                )
            }
            
            // Action Buttons
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                OutlinedButton(
                    onClick = { /* Export stats */ },
                    modifier = Modifier.weight(1f)
                ) {
                    Icon(
                        imageVector = Icons.Default.FileDownload,
                        contentDescription = null,
                        modifier = Modifier.size(16.dp)
                    )
                    Spacer(modifier = Modifier.width(8.dp))
                    Text("Export")
                }
                
                Button(
                    onClick = { /* View detailed analytics */ },
                    modifier = Modifier.weight(1f)
                ) {
                    Icon(
                        imageVector = Icons.Default.Analytics,
                        contentDescription = null,
                        modifier = Modifier.size(16.dp)
                    )
                    Spacer(modifier = Modifier.width(8.dp))
                    Text("Analytics")
                }
            }
        }
    }
}

@Composable
private fun StatCard(
    title: String,
    value: String,
    icon: androidx.compose.ui.graphics.vector.ImageVector,
    color: androidx.compose.ui.graphics.Color,
    modifier: Modifier = Modifier
) {
    Card(
        modifier = modifier,
        colors = CardDefaults.cardColors(
            containerColor = color.copy(alpha = 0.1f)
        ),
        border = androidx.compose.foundation.BorderStroke(
            1.dp,
            color.copy(alpha = 0.3f)
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
                tint = color,
                modifier = Modifier.size(24.dp)
            )
            
            Text(
                text = value,
                style = MaterialTheme.typography.headlineSmall,
                fontWeight = FontWeight.Bold,
                color = color
            )
            
            Text(
                text = title,
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f)
            )
        }
    }
}

@Composable
private fun DetailStatItem(
    icon: androidx.compose.ui.graphics.vector.ImageVector,
    title: String,
    value: String,
    valueColor: androidx.compose.ui.graphics.Color = MaterialTheme.colorScheme.onSurface
) {
    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically
    ) {
        Row(
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            Icon(
                imageVector = icon,
                contentDescription = title,
                tint = MaterialTheme.colorScheme.primary,
                modifier = Modifier.size(20.dp)
            )
            
            Text(
                text = title,
                style = MaterialTheme.typography.bodyMedium
            )
        }
        
        Text(
            text = value,
            style = MaterialTheme.typography.bodyMedium,
            fontWeight = FontWeight.Medium,
            color = valueColor
        )
    }
}

// Compact stats for smaller spaces
@Composable
fun CompactUserStats(
    stats: UserStats,
    modifier: Modifier = Modifier
) {
    Row(
        modifier = modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.spacedBy(8.dp)
    ) {
        CompactStatItem(
            value = stats.emergencyAlertsSent.toString(),
            label = "Alerts",
            modifier = Modifier.weight(1f)
        )
        
        CompactStatItem(
            value = stats.locationSharesSent.toString(),
            label = "Shares",
            modifier = Modifier.weight(1f)
        )
        
        CompactStatItem(
            value = stats.emergencyContactsAdded.toString(),
            label = "Contacts",
            modifier = Modifier.weight(1f)
        )
    }
}

@Composable
private fun CompactStatItem(
    value: String,
    label: String,
    modifier: Modifier = Modifier
) {
    Column(
        modifier = modifier,
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        Text(
            text = value,
            style = MaterialTheme.typography.titleLarge,
            fontWeight = FontWeight.Bold,
            color = MaterialTheme.colorScheme.primary
        )
        
        Text(
            text = label,
            style = MaterialTheme.typography.bodySmall,
            color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f)
        )
    }
}
