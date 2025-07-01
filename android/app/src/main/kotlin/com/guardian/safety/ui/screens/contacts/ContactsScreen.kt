package com.guardian.safety.ui.screens.contacts

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
import androidx.compose.ui.unit.sp
import androidx.navigation.NavHostController
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.guardian.safety.ui.components.BottomNavigation
import com.guardian.safety.ui.viewmodel.ContactsViewModel
import com.guardian.safety.data.model.EmergencyContact
import com.guardian.safety.ui.theme.*

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ContactsScreen(
    navController: NavHostController,
    viewModel: ContactsViewModel = hiltViewModel()
) {
    val contacts by viewModel.emergencyContacts.collectAsStateWithLifecycle()
    val userProfile by viewModel.userProfile.collectAsStateWithLifecycle()
    var showAddDialog by remember { mutableStateOf(false) }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Emergency Contacts") },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = GuardianBlue,
                    titleContentColor = GuardianWhite
                ),
                actions = {
                    IconButton(onClick = { showAddDialog = true }) {
                        Icon(
                            Icons.Default.Add,
                            contentDescription = "Add Contact",
                            tint = GuardianWhite
                        )
                    }
                }
            )
        },
        bottomBar = {
            BottomNavigation(
                navController = navController,
                onSOSPress = { /* Handle SOS */ }
            )
        }
    ) { paddingValues ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
        ) {
            // Guardian Key Card
            userProfile?.let { profile ->
                Card(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(16.dp),
                    colors = CardDefaults.cardColors(
                        containerColor = GuardianBlue.copy(alpha = 0.1f)
                    ),
                    border = androidx.compose.foundation.BorderStroke(
                        1.dp, GuardianBlue.copy(alpha = 0.3f)
                    )
                ) {
                    Column(
                        modifier = Modifier.padding(16.dp)
                    ) {
                        Text(
                            text = "Your Guardian Key",
                            style = MaterialTheme.typography.titleMedium.copy(
                                fontWeight = FontWeight.Bold
                            ),
                            color = GuardianBlue
                        )

                        Spacer(modifier = Modifier.height(8.dp))

                        Text(
                            text = profile.guardianKey,
                            style = MaterialTheme.typography.headlineSmall.copy(
                                fontWeight = FontWeight.Bold
                            ),
                            color = GuardianBlue
                        )

                        Text(
                            text = "Share this key with family and friends so they can add you as an emergency contact",
                            style = MaterialTheme.typography.bodySmall,
                            color = GuardianGray600
                        )
                    }
                }
            }

            // Contacts List
            if (contacts.isEmpty()) {
                Column(
                    modifier = Modifier
                        .fillMaxSize()
                        .padding(32.dp),
                    horizontalAlignment = Alignment.CenterHorizontally,
                    verticalArrangement = Arrangement.Center
                ) {
                    Icon(
                        imageVector = Icons.Default.People,
                        contentDescription = "No Contacts",
                        modifier = Modifier.size(64.dp),
                        tint = GuardianGray400
                    )

                    Spacer(modifier = Modifier.height(16.dp))

                    Text(
                        text = "No Emergency Contacts",
                        style = MaterialTheme.typography.titleLarge.copy(
                            fontWeight = FontWeight.Bold
                        ),
                        color = GuardianGray600
                    )

                    Text(
                        text = "Add emergency contacts to receive alerts when you need help",
                        style = MaterialTheme.typography.bodyMedium,
                        color = GuardianGray500
                    )

                    Spacer(modifier = Modifier.height(24.dp))

                    Button(
                        onClick = { showAddDialog = true },
                        colors = ButtonDefaults.buttonColors(
                            containerColor = GuardianBlue
                        )
                    ) {
                        Icon(Icons.Default.Add, contentDescription = null)
                        Spacer(modifier = Modifier.width(8.dp))
                        Text("Add Your First Contact")
                    }
                }
            } else {
                LazyColumn(
                    modifier = Modifier.fillMaxSize(),
                    contentPadding = PaddingValues(16.dp),
                    verticalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    items(contacts) { contact ->
                        EmergencyContactCard(
                            contact = contact,
                            onRemove = { viewModel.removeContact(contact.id) }
                        )
                    }
                }
            }
        }
    }

    // Add Contact Dialog
    if (showAddDialog) {
        AddContactDialog(
            onDismiss = { showAddDialog = false },
            onAdd = { guardianKey ->
                viewModel.addContactByKey(guardianKey)
                showAddDialog = false
            }
        )
    }
}

@Composable
private fun EmergencyContactCard(
    contact: EmergencyContact,
    onRemove: () -> Unit
) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(
            containerColor = MaterialTheme.colorScheme.surface
        ),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Column(modifier = Modifier.weight(1f)) {
                Text(
                    text = contact.name,
                    style = MaterialTheme.typography.titleMedium.copy(
                        fontWeight = FontWeight.Medium
                    )
                )

                Text(
                    text = "Key: ${contact.guardianKey}",
                    style = MaterialTheme.typography.bodySmall,
                    color = GuardianGray600
                )

                contact.phone?.let { phone ->
                    Text(
                        text = phone,
                        style = MaterialTheme.typography.bodySmall,
                        color = GuardianGray600
                    )
                }
            }

            Row {
                IconButton(onClick = { /* Call contact */ }) {
                    Icon(
                        Icons.Default.Call,
                        contentDescription = "Call",
                        tint = GuardianGreen
                    )
                }

                IconButton(onClick = onRemove) {
                    Icon(
                        Icons.Default.Delete,
                        contentDescription = "Remove",
                        tint = GuardianRed
                    )
                }
            }
        }
    }
}

@Composable
private fun AddContactDialog(
    onDismiss: () -> Unit,
    onAdd: (String) -> Unit
) {
    var guardianKey by remember { mutableStateOf("") }

    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("Add Emergency Contact") },
        text = {
            Column {
                Text(
                    text = "Enter the Guardian Key of the person you want to add as an emergency contact.",
                    style = MaterialTheme.typography.bodyMedium
                )

                Spacer(modifier = Modifier.height(16.dp))

                OutlinedTextField(
                    value = guardianKey,
                    onValueChange = { guardianKey = it },
                    label = { Text("Guardian Key") },
                    placeholder = { Text("GRD-XXX-XXXX") },
                    modifier = Modifier.fillMaxWidth()
                )
            }
        },
        confirmButton = {
            Button(
                onClick = { onAdd(guardianKey) },
                enabled = guardianKey.isNotEmpty(),
                colors = ButtonDefaults.buttonColors(
                    containerColor = GuardianBlue
                )
            ) {
                Text("Add Contact")
            }
        },
        dismissButton = {
            TextButton(onClick = onDismiss) {
                Text("Cancel")
            }
        }
    )
}
