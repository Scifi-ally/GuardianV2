package com.guardian.safety.ui.viewmodel;

@kotlin.Metadata(mv = {1, 9, 0}, k = 1, xi = 48, d1 = {"\u0000B\n\u0002\u0018\u0002\n\u0002\u0018\u0002\n\u0000\n\u0002\u0018\u0002\n\u0000\n\u0002\u0018\u0002\n\u0002\b\u0002\n\u0002\u0018\u0002\n\u0002\u0010 \n\u0002\u0018\u0002\n\u0000\n\u0002\u0018\u0002\n\u0000\n\u0002\u0018\u0002\n\u0002\b\u0005\n\u0002\u0010\u0002\n\u0000\n\u0002\u0010\u000e\n\u0002\b\u0004\b\u0007\u0018\u00002\u00020\u0001B\u0017\b\u0007\u0012\u0006\u0010\u0002\u001a\u00020\u0003\u0012\u0006\u0010\u0004\u001a\u00020\u0005\u00a2\u0006\u0002\u0010\u0006J\u000e\u0010\u0013\u001a\u00020\u00142\u0006\u0010\u0015\u001a\u00020\u0016J\b\u0010\u0017\u001a\u00020\u0014H\u0002J\u000e\u0010\u0018\u001a\u00020\u00142\u0006\u0010\u0019\u001a\u00020\u0016R\u001a\u0010\u0007\u001a\u000e\u0012\n\u0012\b\u0012\u0004\u0012\u00020\n0\t0\bX\u0082\u0004\u00a2\u0006\u0002\n\u0000R\u0016\u0010\u000b\u001a\n\u0012\u0006\u0012\u0004\u0018\u00010\f0\bX\u0082\u0004\u00a2\u0006\u0002\n\u0000R\u000e\u0010\u0002\u001a\u00020\u0003X\u0082\u0004\u00a2\u0006\u0002\n\u0000R\u000e\u0010\u0004\u001a\u00020\u0005X\u0082\u0004\u00a2\u0006\u0002\n\u0000R\u001d\u0010\r\u001a\u000e\u0012\n\u0012\b\u0012\u0004\u0012\u00020\n0\t0\u000e\u00a2\u0006\b\n\u0000\u001a\u0004\b\u000f\u0010\u0010R\u0019\u0010\u0011\u001a\n\u0012\u0006\u0012\u0004\u0018\u00010\f0\u000e\u00a2\u0006\b\n\u0000\u001a\u0004\b\u0012\u0010\u0010\u00a8\u0006\u001a"}, d2 = {"Lcom/guardian/safety/ui/viewmodel/ContactsViewModel;", "Landroidx/lifecycle/ViewModel;", "authRepository", "Lcom/guardian/safety/data/auth/AuthRepository;", "contactRepository", "Lcom/guardian/safety/data/contacts/EmergencyContactRepository;", "(Lcom/guardian/safety/data/auth/AuthRepository;Lcom/guardian/safety/data/contacts/EmergencyContactRepository;)V", "_emergencyContacts", "Lkotlinx/coroutines/flow/MutableStateFlow;", "", "Lcom/guardian/safety/data/model/EmergencyContact;", "_userProfile", "Lcom/guardian/safety/data/model/UserProfile;", "emergencyContacts", "Lkotlinx/coroutines/flow/StateFlow;", "getEmergencyContacts", "()Lkotlinx/coroutines/flow/StateFlow;", "userProfile", "getUserProfile", "addContactByKey", "", "guardianKey", "", "observeAuthState", "removeContact", "contactId", "app_debug"})
@dagger.hilt.android.lifecycle.HiltViewModel()
public final class ContactsViewModel extends androidx.lifecycle.ViewModel {
    @org.jetbrains.annotations.NotNull()
    private final com.guardian.safety.data.auth.AuthRepository authRepository = null;
    @org.jetbrains.annotations.NotNull()
    private final com.guardian.safety.data.contacts.EmergencyContactRepository contactRepository = null;
    @org.jetbrains.annotations.NotNull()
    private final kotlinx.coroutines.flow.MutableStateFlow<com.guardian.safety.data.model.UserProfile> _userProfile = null;
    @org.jetbrains.annotations.NotNull()
    private final kotlinx.coroutines.flow.StateFlow<com.guardian.safety.data.model.UserProfile> userProfile = null;
    @org.jetbrains.annotations.NotNull()
    private final kotlinx.coroutines.flow.MutableStateFlow<java.util.List<com.guardian.safety.data.model.EmergencyContact>> _emergencyContacts = null;
    @org.jetbrains.annotations.NotNull()
    private final kotlinx.coroutines.flow.StateFlow<java.util.List<com.guardian.safety.data.model.EmergencyContact>> emergencyContacts = null;
    
    @javax.inject.Inject()
    public ContactsViewModel(@org.jetbrains.annotations.NotNull()
    com.guardian.safety.data.auth.AuthRepository authRepository, @org.jetbrains.annotations.NotNull()
    com.guardian.safety.data.contacts.EmergencyContactRepository contactRepository) {
        super();
    }
    
    @org.jetbrains.annotations.NotNull()
    public final kotlinx.coroutines.flow.StateFlow<com.guardian.safety.data.model.UserProfile> getUserProfile() {
        return null;
    }
    
    @org.jetbrains.annotations.NotNull()
    public final kotlinx.coroutines.flow.StateFlow<java.util.List<com.guardian.safety.data.model.EmergencyContact>> getEmergencyContacts() {
        return null;
    }
    
    private final void observeAuthState() {
    }
    
    public final void addContactByKey(@org.jetbrains.annotations.NotNull()
    java.lang.String guardianKey) {
    }
    
    public final void removeContact(@org.jetbrains.annotations.NotNull()
    java.lang.String contactId) {
    }
}