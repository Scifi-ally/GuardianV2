package com.guardian.safety.ui.screens.profile

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.navigation.NavHostController
import com.guardian.safety.ui.components.*
import com.guardian.safety.ui.viewmodel.AuthViewModel
import com.guardian.safety.ui.theme.*

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun EnhancedProfileScreen(
    navController: NavHostController,
    authViewModel: AuthViewModel = hiltViewModel()
) {
    val userProfile by authViewModel.userProfile.collectAsStateWithLifecycle()
    var showEditProfile by remember { mutableStateOf(false) }
    var showSafetyTutorial by remember { mutableStateOf(false) }
    var emergencyContacts by remember { mutableStateOf(emptyList<EmergencyContact>()) }
    
    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .background(MaterialTheme.colorScheme.background),
        contentPadding = PaddingValues(16.dp, 16.dp, 16.dp, 120.dp),
        verticalArrangement = Arrangement.spacedBy(20.dp)
    ) {
        item {
            // Profile Header Card
            Card(
                modifier = Modifier.fillMaxWidth(),
                colors = CardDefaults.cardColors(
                    containerColor = MaterialTheme.colorScheme.surface
                ),
                elevation = CardDefaults.cardElevation(defaultElevation = 4.dp),
                shape = RoundedCornerShape(20.dp)
            ) {
                Column(
                    modifier = Modifier.padding(24.dp),
                    horizontalAlignment = Alignment.CenterHorizontally,
                    verticalArrangement = Arrangement.spacedBy(16.dp)
                ) {
                    // Profile Picture
                    Box(
                        modifier = Modifier
                            .size(100.dp)
                            .clip(CircleShape)
                            .background(MaterialTheme.colorScheme.primary.copy(alpha = 0.2f)),
                        contentAlignment = Alignment.Center
                    ) {
                        Text(
                            text = (userProfile?.displayName?.firstOrNull()?.toString() ?: "U").uppercase(),
                            style = MaterialTheme.typography.headlineLarge,
                            fontWeight = FontWeight.Bold,
                            color = MaterialTheme.colorScheme.primary
                        )
                    }
                    
                    // User Info
                    Column(
                        horizontalAlignment = Alignment.CenterHorizontally,
                        verticalArrangement = Arrangement.spacedBy(4.dp)
                    ) {
                        Text(
                            text = userProfile?.displayName ?: "Guardian User",
                            style = MaterialTheme.typography.headlineSmall,
                            fontWeight = FontWeight.Bold
                        )
                        
                        Text(
                            text = userProfile?.email ?: "",
                            style = MaterialTheme.typography.bodyMedium,
                            color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.7f)
                        )
                    }
                    
                    // Edit Profile Button
                    OutlinedButton(
                        onClick = { showEditProfile = true },
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Icon(
                            imageVector = Icons.Default.Edit,
                            contentDescription = null,
                            modifier = Modifier.size(16.dp)
                        )
                        Spacer(modifier = Modifier.width(8.dp))
                        Text("Edit Profile")
                    }
                }
            }
        }
        
        item {
            // Stats Cards Row
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                StatCard(
                    title = "Emergency Contacts",
                    value = emergencyContacts.size.toString(),
                    icon = Icons.Default.People,
                    modifier = Modifier.weight(1f)
                )
                
                StatCard(
                    title = "SOS Alerts Sent",
                    value = "0", // This would come from user stats
                    icon = Icons.Default.Warning,
                    modifier = Modifier.weight(1f)
                )
            }
        }
        
        item {
            // Guardian Key Card
            userProfile?.guardianKey?.let { guardianKey ->
                GuardianKeyCard(guardianKey = guardianKey)
            }
        }
        
        item {
            // Emergency Contacts Section
            Card(
                modifier = Modifier.fillMaxWidth(),
                colors = CardDefaults.cardColors(
                    containerColor = MaterialTheme.colorScheme.surface
                ),
                shape = RoundedCornerShape(16.dp)
            ) {
                Column(
                    modifier = Modifier.padding(20.dp),
                    verticalArrangement = Arrangement.spacedBy(16.dp)
                ) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text(
                            text = "Emergency Contacts",
                            style = MaterialTheme.typography.titleMedium,
                            fontWeight = FontWeight.Bold
                        )
                        
                        TextButton(
                            onClick = { /* Navigate to contacts management */ }
                        ) {
                            Text("Manage")
                            Icon(
                                imageVector = Icons.Default.ArrowForward,
                                contentDescription = null,
                                modifier = Modifier.size(16.dp)
                            )
                        }
                    }
                    
                    if (emergencyContacts.isEmpty()) {
                        Column(
                            horizontalAlignment = Alignment.CenterHorizontally,
                            verticalArrangement = Arrangement.spacedBy(12.dp)
                        ) {
                            Icon(
                                imageVector = Icons.Default.PersonAdd,
                                contentDescription = null,
                                tint = MaterialTheme.colorScheme.primary,
                                modifier = Modifier.size(32.dp)
                            )
                            Text(
                                text = "No emergency contacts yet",
                                style = MaterialTheme.typography.bodyMedium
                            )
                            Text(
                                text = "Add people who can help in emergencies. They will receive notifications when you press the SOS button.",
                                style = MaterialTheme.typography.bodySmall,
                                color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.7f)
                            )
                        }
                    } else {
                        // Show first few contacts
                        emergencyContacts.take(3).forEach { contact ->
                            Row(
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.spacedBy(12.dp)
                            ) {
                                Box(
                                    modifier = Modifier
                                        .size(40.dp)
                                        .clip(CircleShape)
                                        .background(MaterialTheme.colorScheme.primary.copy(alpha = 0.1f)),
                                    contentAlignment = Alignment.Center
                                ) {
                                    Text(
                                        text = contact.name.take(1).uppercase(),
                                        style = MaterialTheme.typography.titleSmall,
                                        fontWeight = FontWeight.Bold,
                                        color = MaterialTheme.colorScheme.primary
                                    )
                                }
                                
                                Column {
                                    Text(
                                        text = contact.name,
                                        style = MaterialTheme.typography.bodyMedium,
                                        fontWeight = FontWeight.Medium
                                    )
                                    Text(
                                        text = contact.relationship,
                                        style = MaterialTheme.typography.bodySmall,
                                        color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f)
                                    )
                                }
                            }
                        }
                    }
                }
            }
        }
        
        item {
            // Quick Settings
            Card(
                modifier = Modifier.fillMaxWidth(),
                colors = CardDefaults.cardColors(
                    containerColor = MaterialTheme.colorScheme.surface
                ),
                shape = RoundedCornerShape(16.dp)
            ) {
                Column(
                    modifier = Modifier.padding(20.dp),
                    verticalArrangement = Arrangement.spacedBy(16.dp)
                ) {
                    Text(
                        text = "Quick Settings",
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.Bold
                    )
                    
                    SettingsItem(
                        icon = Icons.Default.LocationOn,
                        title = "Location Sharing",
                        subtitle = "Allow emergency contacts to see your location",
                        onClick = { /* Toggle location sharing */ }
                    )
                    
                    SettingsItem(
                        icon = Icons.Default.Notifications,
                        title = "Notifications",
                        subtitle = "Emergency alerts and app notifications",
                        onClick = { /* Navigate to notification settings */ }
                    )
                    
                    SettingsItem(
                        icon = Icons.Default.School,
                        title = "Safety Tutorial",
                        subtitle = "Learn how to use Guardian's safety features",
                        onClick = { showSafetyTutorial = true }
                    )
                }
            }
        }
        
        item {
            // Account Actions
            Card(
                modifier = Modifier.fillMaxWidth(),
                colors = CardDefaults.cardColors(
                    containerColor = MaterialTheme.colorScheme.surface
                ),
                shape = RoundedCornerShape(16.dp)
            ) {
                Column(
                    modifier = Modifier.padding(20.dp),
                    verticalArrangement = Arrangement.spacedBy(16.dp)
                ) {
                    Text(
                        text = "Account",
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.Bold
                    )
                    
                    SettingsItem(
                        icon = Icons.Default.Security,
                        title = "Privacy & Security",
                        subtitle = "Manage your privacy settings",
                        onClick = { /* Navigate to privacy settings */ }
                    )
                    
                    SettingsItem(
                        icon = Icons.Default.Help,
                        title = "Help & Support",
                        subtitle = "Get help and contact support",
                        onClick = { /* Navigate to help */ }
                    )
                    
                    SettingsItem(
                        icon = Icons.Default.Info,
                        title = "About Guardian",
                        subtitle = "App version and information",
                        onClick = { /* Show about dialog */ }
                    )
                    
                    SettingsItem(
                        icon = Icons.Default.Logout,
                        title = "Sign Out",
                        subtitle = "Sign out of your account",
                        onClick = { authViewModel.signOut() },
                        isDestructive = true
                    )
                }
            }
        }
    }
    
    // Dialogs
    if (showEditProfile) {
        EditProfileDialog(
            userProfile = userProfile,
            onDismiss = { showEditProfile = false },
            onSave = { /* Save profile changes */ }
        )
    }
    
    InteractiveSafetyTutorial(
        isOpen = showSafetyTutorial,
        onClose = { showSafetyTutorial = false },
        onComplete = { showSafetyTutorial = false }
    )
}

@Composable
private fun StatCard(
    title: String,
    value: String,
    icon: androidx.compose.ui.graphics.vector.ImageVector,
    modifier: Modifier = Modifier
) {
    Card(
        modifier = modifier,
        colors = CardDefaults.cardColors(
            containerColor = MaterialTheme.colorScheme.surface
        ),
        shape = RoundedCornerShape(12.dp)
    ) {
        Column(
            modifier = Modifier.padding(16.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            Icon(
                imageVector = icon,
                contentDescription = title,
                tint = MaterialTheme.colorScheme.primary,
                modifier = Modifier.size(24.dp)
            )
            
            Text(
                text = value,
                style = MaterialTheme.typography.headlineSmall,
                fontWeight = FontWeight.Bold
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
private fun SettingsItem(
    icon: androidx.compose.ui.graphics.vector.ImageVector,
    title: String,
    subtitle: String,
    onClick: () -> Unit,
    isDestructive: Boolean = false
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(8.dp))
            .background(
                if (isDestructive) GuardianRed.copy(alpha = 0.05f)
                else MaterialTheme.colorScheme.surface
            )
            .padding(12.dp),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        Icon(
            imageVector = icon,
            contentDescription = title,
            tint = if (isDestructive) GuardianRed else MaterialTheme.colorScheme.primary,
            modifier = Modifier.size(24.dp)
        )
        
        Column(
            modifier = Modifier.weight(1f)
        ) {
            Text(
                text = title,
                style = MaterialTheme.typography.bodyLarge,
                fontWeight = FontWeight.Medium,
                color = if (isDestructive) GuardianRed else MaterialTheme.colorScheme.onSurface
            )
            Text(
                text = subtitle,
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f)
            )
        }
        
        IconButton(onClick = onClick) {
            Icon(
                imageVector = Icons.Default.ChevronRight,
                contentDescription = "Navigate",
                tint = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.4f)
            )
        }
    }
}

@Composable
private fun EditProfileDialog(
    userProfile: com.guardian.safety.data.model.UserProfile?,
    onDismiss: () -> Unit,
    onSave: (name: String, email: String) -> Unit
) {
    var name by remember { mutableStateOf(userProfile?.displayName ?: "") }
    var email by remember { mutableStateOf(userProfile?.email ?: "") }
    
    AlertDialog(
        onDismissRequest = onDismiss,
        title = {
            Text(
                text = "Edit Profile",
                style = MaterialTheme.typography.titleLarge,
                fontWeight = FontWeight.Bold
            )
        },
        text = {
            Column(
                verticalArrangement = Arrangement.spacedBy(16.dp)
            ) {
                OutlinedTextField(
                    value = name,
                    onValueChange = { name = it },
                    label = { Text("Display Name") },
                    modifier = Modifier.fillMaxWidth(),
                    leadingIcon = {
                        Icon(Icons.Default.Person, contentDescription = null)
                    }
                )
                
                OutlinedTextField(
                    value = email,
                    onValueChange = { email = it },
                    label = { Text("Email") },
                    modifier = Modifier.fillMaxWidth(),
                    leadingIcon = {
                        Icon(Icons.Default.Email, contentDescription = null)
                    },
                    enabled = false // Usually email can't be changed
                )
            }
        },
        confirmButton = {
            Button(
                onClick = {
                    onSave(name, email)
                    onDismiss()
                },
                enabled = name.isNotBlank()
            ) {
                Text("Save")
            }
        },
        dismissButton = {
            TextButton(onClick = onDismiss) {
                Text("Cancel")
            }
        }
    )
}
