package com.guardian.safety.ui.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.guardian.safety.data.auth.AuthRepository
import com.guardian.safety.data.contacts.EmergencyContactRepository
import com.guardian.safety.data.model.EmergencyContact
import com.guardian.safety.data.model.UserProfile
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch
import java.util.*
import javax.inject.Inject

@HiltViewModel
class ContactsViewModel @Inject constructor(
    private val authRepository: AuthRepository,
    private val contactRepository: EmergencyContactRepository
) : ViewModel() {

    private val _userProfile = MutableStateFlow<UserProfile?>(null)
    val userProfile: StateFlow<UserProfile?> = _userProfile.asStateFlow()
    
    private val _emergencyContacts = MutableStateFlow<List<EmergencyContact>>(emptyList())
    val emergencyContacts: StateFlow<List<EmergencyContact>> = _emergencyContacts.asStateFlow()

    init {
        observeAuthState()
    }
    
    private fun observeAuthState() {
        viewModelScope.launch {
            authRepository.currentUser.collect { user ->
                if (user != null) {
                    val profile = authRepository.loadUserProfile(user.uid)
                    _userProfile.value = profile
                    
                    // Load emergency contacts
                    contactRepository.getEmergencyContacts(user.uid).collect { contacts ->
                        _emergencyContacts.value = contacts
                    }
                } else {
                    _userProfile.value = null
                    _emergencyContacts.value = emptyList()
                }
            }
        }
    }
    
    fun addContactByKey(guardianKey: String) {
        viewModelScope.launch {
            val userId = _userProfile.value?.uid ?: return@launch
            
            // Find contact by guardian key
            val foundContact = contactRepository.findContactByGuardianKey(guardianKey)
            
            if (foundContact != null) {
                val newContact = EmergencyContact(
                    id = UUID.randomUUID().toString(),
                    guardianKey = guardianKey,
                    name = foundContact.name,
                    phone = foundContact.phone,
                    priority = _emergencyContacts.value.size + 1,
                    addedAt = Date(),
                    isActive = true
                )
                
                contactRepository.addEmergencyContact(userId, newContact)
            }
        }
    }
    
    fun removeContact(contactId: String) {
        viewModelScope.launch {
            val userId = _userProfile.value?.uid ?: return@launch
            contactRepository.removeEmergencyContact(userId, contactId)
        }
    }
}
