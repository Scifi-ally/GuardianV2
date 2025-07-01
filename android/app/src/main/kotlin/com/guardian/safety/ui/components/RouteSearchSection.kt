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
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.guardian.safety.ui.theme.*

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun RouteSearchSection(
    fromLocation: String,
    toLocation: String,
    onFromLocationChange: (String) -> Unit,
    onToLocationChange: (String) -> Unit,
    onSearch: () -> Unit,
    onClear: () -> Unit,
    travelMode: String,
    onTravelModeChange: (String) -> Unit
) {
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .padding(12.dp)
    ) {
        // Main search row
        Row(
            modifier = Modifier.fillMaxWidth(),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            // From input
            OutlinedTextField(
                value = fromLocation,
                onValueChange = onFromLocationChange,
                placeholder = { Text("From", fontSize = 12.sp) },
                leadingIcon = {
                    Box(
                        modifier = Modifier
                            .size(8.dp)
                            .background(
                                MaterialTheme.colorScheme.onSurface,
                                RoundedCornerShape(4.dp)
                            )
                    )
                },
                trailingIcon = {
                    IconButton(
                        onClick = { /* Get current location */ },
                        modifier = Modifier.size(24.dp)
                    ) {
                        Icon(
                            imageVector = Icons.Default.MyLocation,
                            contentDescription = "Current Location",
                            modifier = Modifier.size(16.dp)
                        )
                    }
                },
                modifier = Modifier.weight(1f),
                textStyle = MaterialTheme.typography.bodySmall,
                colors = OutlinedTextFieldDefaults.colors(
                    focusedBorderColor = GuardianBlue.copy(alpha = 0.3f),
                    unfocusedBorderColor = GuardianGray300
                )
            )

            // Arrow separator
            Icon(
                imageVector = Icons.Default.ArrowForward,
                contentDescription = "To",
                modifier = Modifier.size(12.dp),
                tint = GuardianGray400
            )

            // To input
            OutlinedTextField(
                value = toLocation,
                onValueChange = onToLocationChange,
                placeholder = { Text("To destination", fontSize = 12.sp) },
                leadingIcon = {
                    Box(
                        modifier = Modifier
                            .size(8.dp)
                            .background(
                                MaterialTheme.colorScheme.onSurface,
                                RoundedCornerShape(4.dp)
                            )
                    )
                },
                modifier = Modifier.weight(1f),
                textStyle = MaterialTheme.typography.bodySmall,
                colors = OutlinedTextFieldDefaults.colors(
                    focusedBorderColor = GuardianBlue.copy(alpha = 0.3f),
                    unfocusedBorderColor = GuardianGray300
                )
            )

            // Go button
            Button(
                onClick = onSearch,
                enabled = fromLocation.isNotEmpty() && toLocation.isNotEmpty(),
                modifier = Modifier.height(36.dp),
                colors = ButtonDefaults.buttonColors(
                    containerColor = GuardianBlue,
                    disabledContainerColor = GuardianGray300
                ),
                contentPadding = PaddingValues(horizontal = 12.dp),
                shape = RoundedCornerShape(6.dp)
            ) {
                Icon(
                    imageVector = Icons.Default.Route,
                    contentDescription = "Search Routes",
                    modifier = Modifier.size(14.dp),
                    tint = GuardianWhite
                )
                Spacer(modifier = Modifier.width(4.dp))
                Text(
                    text = "Go",
                    fontSize = 12.sp,
                    fontWeight = FontWeight.Medium,
                    color = GuardianWhite
                )
            }

            // Clear button (show when routes are active)
            if (fromLocation.isNotEmpty() || toLocation.isNotEmpty()) {
                Button(
                    onClick = onClear,
                    modifier = Modifier.height(36.dp),
                    colors = ButtonDefaults.outlinedButtonColors(),
                    contentPadding = PaddingValues(horizontal = 8.dp),
                    shape = RoundedCornerShape(6.dp)
                ) {
                    Text(
                        text = "Clear",
                        fontSize = 12.sp,
                        color = GuardianGray600
                    )
                }
            }
        }

        // Travel mode selection
        Spacer(modifier = Modifier.height(8.dp))

        Row(
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(4.dp)
        ) {
            Text(
                text = "Travel by:",
                fontSize = 12.sp,
                color = GuardianGray600
            )

            // Walking
            FilterChip(
                onClick = { onTravelModeChange("WALKING") },
                label = {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Icon(
                            imageVector = Icons.Default.DirectionsWalk,
                            contentDescription = "Walk",
                            modifier = Modifier.size(12.dp)
                        )
                        Spacer(modifier = Modifier.width(2.dp))
                        Text("Walk", fontSize = 10.sp)
                    }
                },
                selected = travelMode == "WALKING",
                modifier = Modifier.height(28.dp),
                colors = FilterChipDefaults.filterChipColors(
                    selectedContainerColor = GuardianBlue,
                    selectedLabelColor = GuardianWhite
                )
            )

            // Driving
            FilterChip(
                onClick = { onTravelModeChange("DRIVING") },
                label = {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Icon(
                            imageVector = Icons.Default.DirectionsCar,
                            contentDescription = "Car",
                            modifier = Modifier.size(12.dp)
                        )
                        Spacer(modifier = Modifier.width(2.dp))
                        Text("Car", fontSize = 10.sp)
                    }
                },
                selected = travelMode == "DRIVING",
                modifier = Modifier.height(28.dp),
                colors = FilterChipDefaults.filterChipColors(
                    selectedContainerColor = GuardianBlue,
                    selectedLabelColor = GuardianWhite
                )
            )

            // Bicycling
            FilterChip(
                onClick = { onTravelModeChange("BICYCLING") },
                label = {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Icon(
                            imageVector = Icons.Default.DirectionsBike,
                            contentDescription = "Bike",
                            modifier = Modifier.size(12.dp)
                        )
                        Spacer(modifier = Modifier.width(2.dp))
                        Text("Bike", fontSize = 10.sp)
                    }
                },
                selected = travelMode == "BICYCLING",
                modifier = Modifier.height(28.dp),
                colors = FilterChipDefaults.filterChipColors(
                    selectedContainerColor = GuardianBlue,
                    selectedLabelColor = GuardianWhite
                )
            )
        }
    }
}
