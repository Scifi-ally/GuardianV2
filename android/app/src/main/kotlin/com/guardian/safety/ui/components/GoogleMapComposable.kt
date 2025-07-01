package com.guardian.safety.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.guardian.safety.ui.theme.*

@Composable
fun GoogleMapComposable(
    modifier: Modifier = Modifier,
    fromLocation: String,
    toLocation: String,
    travelMode: String,
    isNavigating: Boolean
) {
    // For now, this is a placeholder that simulates the web app's Google Map
    // In a real implementation, you would integrate Google Maps SDK for Android
    Box(
        modifier = modifier
            .fillMaxSize()
            .background(GuardianGray100),
        contentAlignment = Alignment.Center
    ) {
        // Map background pattern (placeholder)
        Column(
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.Center
        ) {
            Icon(
                imageVector = Icons.Default.Map,
                contentDescription = "Map",
                modifier = Modifier.size(64.dp),
                tint = GuardianGray400
            )
            
            Spacer(modifier = Modifier.height(16.dp))
            
            Text(
                text = "Interactive Map",
                style = MaterialTheme.typography.titleMedium.copy(
                    fontWeight = FontWeight.Medium
                ),
                color = GuardianGray600
            )
            
            Text(
                text = "Google Maps integration would go here",
                style = MaterialTheme.typography.bodySmall,
                color = GuardianGray500
            )
            
            if (isNavigating && fromLocation.isNotEmpty() && toLocation.isNotEmpty()) {
                Spacer(modifier = Modifier.height(16.dp))
                
                Card(
                    colors = CardDefaults.cardColors(
                        containerColor = GuardianBlue.copy(alpha = 0.1f)
                    ),
                    border = androidx.compose.foundation.BorderStroke(
                        1.dp, 
                        GuardianBlue.copy(alpha = 0.3f)
                    )
                ) {
                    Column(
                        modifier = Modifier.padding(16.dp),
                        horizontalAlignment = Alignment.CenterHorizontally
                    ) {
                        Text(
                            text = "Route Active",
                            style = MaterialTheme.typography.titleSmall.copy(
                                fontWeight = FontWeight.Bold
                            ),
                            color = GuardianBlue
                        )
                        
                        Spacer(modifier = Modifier.height(8.dp))
                        
                        Text(
                            text = "From: $fromLocation",
                            style = MaterialTheme.typography.bodySmall,
                            color = GuardianGray700
                        )
                        
                        Text(
                            text = "To: $toLocation",
                            style = MaterialTheme.typography.bodySmall,
                            color = GuardianGray700
                        )
                        
                        Text(
                            text = "Mode: $travelMode",
                            style = MaterialTheme.typography.bodySmall,
                            color = GuardianGray700
                        )
                    }
                }
            }
        }
        
        // Floating action buttons (like web app)
        Column(
            modifier = Modifier
                .align(Alignment.TopEnd)
                .padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            FloatingActionButton(
                onClick = { /* Toggle map type */ },
                modifier = Modifier.size(40.dp),
                containerColor = MaterialTheme.colorScheme.surface,
                contentColor = GuardianGray600
            ) {
                Icon(
                    imageVector = Icons.Default.Layers,
                    contentDescription = "Map Type",
                    modifier = Modifier.size(20.dp)
                )
            }
            
            FloatingActionButton(
                onClick = { /* Center on location */ },
                modifier = Modifier.size(40.dp),
                containerColor = MaterialTheme.colorScheme.surface,
                contentColor = GuardianGray600
            ) {
                Icon(
                    imageVector = Icons.Default.MyLocation,
                    contentDescription = "My Location",
                    modifier = Modifier.size(20.dp)
                )
            }
        }
    }
}
