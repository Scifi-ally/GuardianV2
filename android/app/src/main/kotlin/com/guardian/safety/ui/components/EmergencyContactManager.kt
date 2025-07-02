package com.guardian.safety.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
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
import androidx.compose.ui.window.Dialog
import com.guardian.safety.ui.theme.*

data class EmergencyContact(
    val id: String,
    val name: String,
    val phone: String,
    val relationship: String,
    val guardianKey: String = "",
    val isPrimary: Boolean = false
)

@Composable
fun EmergencyContactManager(
    contacts: List<EmergencyContact>,
    onAddContact: (EmergencyContact) -> Unit,
    onRemoveContact: (String) -> Unit,
    onUpdateContact: (EmergencyContact) -> Unit,
    modifier: Modifier = Modifier
) {
    var showAddDialog by remember { mutableStateOf(false) }
    var editingContact by remember { mutableStateOf<EmergencyContact?>(null) }
    
    Column(
        modifier = modifier.fillMaxWidth(),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        // Header
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                Icon(
                    imageVector = Icons.Default.People,
                    contentDescription = "Emergency Contacts",
                    tint = MaterialTheme.colorScheme.primary,
                    modifier = Modifier.size(20.dp)
                )
                Text(
                    text = "Emergency Contacts",
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.Bold
                )
            }
            
            IconButton(
                onClick = { showAddDialog = true }
            ) {
                Icon(
                    imageVector = Icons.Default.Add,
                    contentDescription = "Add Contact",
                    tint = MaterialTheme.colorScheme.primary
                )
            }
        }
        
        // Contacts list
        if (contacts.isEmpty()) {
            Card(
                modifier = Modifier.fillMaxWidth(),
                colors = CardDefaults.cardColors(
                    containerColor = MaterialTheme.colorScheme.surface.copy(alpha = 0.5f)
                )
            ) {
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(24.dp),
                    horizontalAlignment = Alignment.CenterHorizontally,
                    verticalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    Icon(
                        imageVector = Icons.Default.PersonAdd,
                        contentDescription = null,
                        tint = MaterialTheme.colorScheme.primary,
                        modifier = Modifier.size(48.dp)
                    )
                    Text(
                        text = "No emergency contacts yet",
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.Medium
                    )
                    Text(
                        text = "Add trusted contacts who will receive your emergency alerts",
                        style = MaterialTheme.typography.bodyMedium,
                        color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.7f)
                    )
                    Button(
                        onClick = { showAddDialog = true },
                        colors = ButtonDefaults.buttonColors(
                            containerColor = MaterialTheme.colorScheme.primary
                        )
                    ) {
                        Icon(
                            imageVector = Icons.Default.Add,
                            contentDescription = null,
                            modifier = Modifier.size(16.dp)
                        )
                        Spacer(modifier = Modifier.width(8.dp))
                        Text("Add First Contact")
                    }
                }
            }
        } else {
            LazyColumn(
                verticalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                items(contacts) { contact ->
                    EmergencyContactCard(
                        contact = contact,
                        onEdit = { editingContact = it },
                        onRemove = { onRemoveContact(contact.id) }
                    )
                }
            }
        }
    }
    
    // Add/Edit Dialog
    if (showAddDialog || editingContact != null) {
        EmergencyContactDialog(
            contact = editingContact,
            onDismiss = {
                showAddDialog = false
                editingContact = null
            },
            onSave = { contact ->
                if (editingContact != null) {
                    onUpdateContact(contact)
                } else {
                    onAddContact(contact)
                }
                showAddDialog = false
                editingContact = null
            }
        )
    }
}

@Composable
private fun EmergencyContactCard(
    contact: EmergencyContact,
    onEdit: (EmergencyContact) -> Unit,
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
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                // Avatar
                Box(
                    modifier = Modifier
                        .size(48.dp)
                        .clip(CircleShape)
                        .background(MaterialTheme.colorScheme.primary.copy(alpha = 0.1f)),
                    contentAlignment = Alignment.Center
                ) {
                    Text(
                        text = contact.name.take(1).uppercase(),
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.Bold,
                        color = MaterialTheme.colorScheme.primary
                    )
                }
                
                // Contact info
                Column {
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        Text(
                            text = contact.name,
                            style = MaterialTheme.typography.titleMedium,
                            fontWeight = FontWeight.Medium
                        )
                        if (contact.isPrimary) {
                            Badge(
                                containerColor = MaterialTheme.colorScheme.primary,
                                contentColor = MaterialTheme.colorScheme.onPrimary
                            ) {
                                Text("Primary", style = MaterialTheme.typography.labelSmall)
                            }
                        }
                    }
                    Text(
                        text = contact.phone,
                        style = MaterialTheme.typography.bodyMedium,
                        color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.7f)
                    )
                    Text(
                        text = contact.relationship,
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.5f)
                    )
                }
            }
            
            // Actions
            Row {
                IconButton(onClick = { onEdit(contact) }) {
                    Icon(
                        imageVector = Icons.Default.Edit,
                        contentDescription = "Edit Contact",
                        tint = MaterialTheme.colorScheme.primary
                    )
                }
                IconButton(onClick = onRemove) {
                    Icon(
                        imageVector = Icons.Default.Delete,
                        contentDescription = "Remove Contact",
                        tint = GuardianRed
                    )
                }
            }
        }
    }
}

@Composable
private fun EmergencyContactDialog(
    contact: EmergencyContact?,
    onDismiss: () -> Unit,
    onSave: (EmergencyContact) -> Unit
) {
    var name by remember { mutableStateOf(contact?.name ?: "") }
    var phone by remember { mutableStateOf(contact?.phone ?: "") }
    var relationship by remember { mutableStateOf(contact?.relationship ?: "") }
    var guardianKey by remember { mutableStateOf(contact?.guardianKey ?: "") }
    var isPrimary by remember { mutableStateOf(contact?.isPrimary ?: false) }
    
    Dialog(onDismissRequest = onDismiss) {
        Card(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp),
            shape = RoundedCornerShape(16.dp)
        ) {
            Column(
                modifier = Modifier.padding(24.dp),
                verticalArrangement = Arrangement.spacedBy(16.dp)
            ) {
                Text(
                    text = if (contact == null) "Add Emergency Contact" else "Edit Contact",
                    style = MaterialTheme.typography.titleLarge,
                    fontWeight = FontWeight.Bold
                )
                
                OutlinedTextField(
                    value = name,
                    onValueChange = { name = it },
                    label = { Text("Full Name") },
                    modifier = Modifier.fillMaxWidth(),
                    leadingIcon = {
                        Icon(Icons.Default.Person, contentDescription = null)
                    }
                )
                
                OutlinedTextField(
                    value = phone,
                    onValueChange = { phone = it },
                    label = { Text("Phone Number") },
                    modifier = Modifier.fillMaxWidth(),
                    leadingIcon = {
                        Icon(Icons.Default.Phone, contentDescription = null)
                    }
                )
                
                OutlinedTextField(
                    value = relationship,
                    onValueChange = { relationship = it },
                    label = { Text("Relationship") },
                    modifier = Modifier.fillMaxWidth(),
                    leadingIcon = {
                        Icon(Icons.Default.Family, contentDescription = null)
                    }
                )
                
                OutlinedTextField(
                    value = guardianKey,
                    onValueChange = { guardianKey = it },
                    label = { Text("Guardian Key (Optional)") },
                    modifier = Modifier.fillMaxWidth(),
                    leadingIcon = {
                        Icon(Icons.Default.Key, contentDescription = null)
                    }
                )
                
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text("Primary Contact")
                    Switch(
                        checked = isPrimary,
                        onCheckedChange = { isPrimary = it }
                    )
                }
                
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    OutlinedButton(
                        onClick = onDismiss,
                        modifier = Modifier.weight(1f)
                    ) {
                        Text("Cancel")
                    }
                    
                    Button(
                        onClick = {
                            val newContact = EmergencyContact(
                                id = contact?.id ?: java.util.UUID.randomUUID().toString(),
                                name = name,
                                phone = phone,
                                relationship = relationship,
                                guardianKey = guardianKey,
                                isPrimary = isPrimary
                            )
                            onSave(newContact)
                        },
                        modifier = Modifier.weight(1f),
                        enabled = name.isNotBlank() && phone.isNotBlank()
                    ) {
                        Text("Save")
                    }
                }
            }
        }
    }
}
