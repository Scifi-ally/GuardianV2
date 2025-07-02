package com.guardian.safety.presentation.viewmodels;

@kotlin.Metadata(mv = {1, 9, 0}, k = 1, xi = 48, d1 = {"\u0000:\n\u0002\u0018\u0002\n\u0002\u0018\u0002\n\u0000\n\u0002\u0018\u0002\n\u0002\b\u0002\n\u0002\u0018\u0002\n\u0002\u0018\u0002\n\u0000\n\u0002\u0018\u0002\n\u0002\b\u0003\n\u0002\u0010\u0002\n\u0000\n\u0002\u0010\u000e\n\u0002\b\u0004\n\u0002\u0010\b\n\u0002\b\u0004\b\u0007\u0018\u00002\u00020\u0001B\u000f\b\u0007\u0012\u0006\u0010\u0002\u001a\u00020\u0003\u00a2\u0006\u0002\u0010\u0004J.\u0010\f\u001a\u00020\r2\u0006\u0010\u000e\u001a\u00020\u000f2\u0006\u0010\u0010\u001a\u00020\u000f2\u0006\u0010\u0011\u001a\u00020\u000f2\u0006\u0010\u0012\u001a\u00020\u000f2\u0006\u0010\u0013\u001a\u00020\u0014J\u0006\u0010\u0015\u001a\u00020\rJ\u0016\u0010\u0016\u001a\u00020\r2\u0006\u0010\u000e\u001a\u00020\u000f2\u0006\u0010\u0017\u001a\u00020\u000fR\u0014\u0010\u0005\u001a\b\u0012\u0004\u0012\u00020\u00070\u0006X\u0082\u0004\u00a2\u0006\u0002\n\u0000R\u000e\u0010\u0002\u001a\u00020\u0003X\u0082\u0004\u00a2\u0006\u0002\n\u0000R\u0017\u0010\b\u001a\b\u0012\u0004\u0012\u00020\u00070\t\u00a2\u0006\b\n\u0000\u001a\u0004\b\n\u0010\u000b\u00a8\u0006\u0018"}, d2 = {"Lcom/guardian/safety/presentation/viewmodels/ContactsViewModel;", "Landroidx/lifecycle/ViewModel;", "emergencyContactsRepository", "Lcom/guardian/safety/data/repositories/EmergencyContactsRepository;", "(Lcom/guardian/safety/data/repositories/EmergencyContactsRepository;)V", "_uiState", "Lkotlinx/coroutines/flow/MutableStateFlow;", "Lcom/guardian/safety/presentation/viewmodels/ContactsUiState;", "uiState", "Lkotlinx/coroutines/flow/StateFlow;", "getUiState", "()Lkotlinx/coroutines/flow/StateFlow;", "addContact", "", "userId", "", "name", "relationship", "guardianKey", "priority", "", "clearError", "removeContact", "contactId", "app_debug"})
@dagger.hilt.android.lifecycle.HiltViewModel()
public final class ContactsViewModel extends androidx.lifecycle.ViewModel {
    @org.jetbrains.annotations.NotNull()
    private final com.guardian.safety.data.repositories.EmergencyContactsRepository emergencyContactsRepository = null;
    @org.jetbrains.annotations.NotNull()
    private final kotlinx.coroutines.flow.MutableStateFlow<com.guardian.safety.presentation.viewmodels.ContactsUiState> _uiState = null;
    @org.jetbrains.annotations.NotNull()
    private final kotlinx.coroutines.flow.StateFlow<com.guardian.safety.presentation.viewmodels.ContactsUiState> uiState = null;
    
    @javax.inject.Inject()
    public ContactsViewModel(@org.jetbrains.annotations.NotNull()
    com.guardian.safety.data.repositories.EmergencyContactsRepository emergencyContactsRepository) {
        super();
    }
    
    @org.jetbrains.annotations.NotNull()
    public final kotlinx.coroutines.flow.StateFlow<com.guardian.safety.presentation.viewmodels.ContactsUiState> getUiState() {
        return null;
    }
    
    public final void addContact(@org.jetbrains.annotations.NotNull()
    java.lang.String userId, @org.jetbrains.annotations.NotNull()
    java.lang.String name, @org.jetbrains.annotations.NotNull()
    java.lang.String relationship, @org.jetbrains.annotations.NotNull()
    java.lang.String guardianKey, int priority) {
    }
    
    public final void removeContact(@org.jetbrains.annotations.NotNull()
    java.lang.String userId, @org.jetbrains.annotations.NotNull()
    java.lang.String contactId) {
    }
    
    public final void clearError() {
    }
}