package com.guardian.safety.presentation.viewmodels;

@kotlin.Metadata(mv = {1, 9, 0}, k = 1, xi = 48, d1 = {"\u0000N\n\u0002\u0018\u0002\n\u0002\u0018\u0002\n\u0000\n\u0002\u0018\u0002\n\u0000\n\u0002\u0018\u0002\n\u0002\b\u0002\n\u0002\u0018\u0002\n\u0002\u0018\u0002\n\u0000\n\u0002\u0018\u0002\n\u0000\n\u0002\u0018\u0002\n\u0000\n\u0002\u0018\u0002\n\u0002\b\u0003\n\u0002\u0010\u000b\n\u0002\b\u000b\n\u0002\u0010\u0002\n\u0002\b\u0004\n\u0002\u0010\u000e\n\u0002\b\u0007\b\u0007\u0018\u00002\u00020\u0001B\u0017\b\u0007\u0012\u0006\u0010\u0002\u001a\u00020\u0003\u0012\u0006\u0010\u0004\u001a\u00020\u0005\u00a2\u0006\u0002\u0010\u0006J\u0006\u0010\u001e\u001a\u00020\u001fJ\b\u0010 \u001a\u00020\u001fH\u0002J\b\u0010!\u001a\u00020\u001fH\u0002J\u0016\u0010\"\u001a\u00020\u001f2\u0006\u0010#\u001a\u00020$2\u0006\u0010%\u001a\u00020$J\u0006\u0010&\u001a\u00020\u001fJ\u001e\u0010\'\u001a\u00020\u001f2\u0006\u0010#\u001a\u00020$2\u0006\u0010%\u001a\u00020$2\u0006\u0010(\u001a\u00020$J\u000e\u0010)\u001a\u00020\u001f2\u0006\u0010*\u001a\u00020\rR\u0016\u0010\u0007\u001a\n\u0012\u0006\u0012\u0004\u0018\u00010\t0\bX\u0082\u0004\u00a2\u0006\u0002\n\u0000R\u0014\u0010\n\u001a\b\u0012\u0004\u0012\u00020\u000b0\bX\u0082\u0004\u00a2\u0006\u0002\n\u0000R\u0016\u0010\f\u001a\n\u0012\u0006\u0012\u0004\u0018\u00010\r0\bX\u0082\u0004\u00a2\u0006\u0002\n\u0000R\u000e\u0010\u0002\u001a\u00020\u0003X\u0082\u0004\u00a2\u0006\u0002\n\u0000R\u0019\u0010\u000e\u001a\n\u0012\u0006\u0012\u0004\u0018\u00010\t0\u000f\u00a2\u0006\b\n\u0000\u001a\u0004\b\u0010\u0010\u0011R\u000e\u0010\u0004\u001a\u00020\u0005X\u0082\u0004\u00a2\u0006\u0002\n\u0000R+\u0010\u0014\u001a\u00020\u00132\u0006\u0010\u0012\u001a\u00020\u00138F@BX\u0086\u008e\u0002\u00a2\u0006\u0012\n\u0004\b\u0018\u0010\u0019\u001a\u0004\b\u0014\u0010\u0015\"\u0004\b\u0016\u0010\u0017R\u0017\u0010\u001a\u001a\b\u0012\u0004\u0012\u00020\u000b0\u000f\u00a2\u0006\b\n\u0000\u001a\u0004\b\u001b\u0010\u0011R\u0019\u0010\u001c\u001a\n\u0012\u0006\u0012\u0004\u0018\u00010\r0\u000f\u00a2\u0006\b\n\u0000\u001a\u0004\b\u001d\u0010\u0011\u00a8\u0006+"}, d2 = {"Lcom/guardian/safety/presentation/viewmodels/AuthViewModel;", "Landroidx/lifecycle/ViewModel;", "authRepository", "Lcom/guardian/safety/data/repositories/AuthRepository;", "emergencyContactsRepository", "Lcom/guardian/safety/data/repositories/EmergencyContactsRepository;", "(Lcom/guardian/safety/data/repositories/AuthRepository;Lcom/guardian/safety/data/repositories/EmergencyContactsRepository;)V", "_currentUser", "Lkotlinx/coroutines/flow/MutableStateFlow;", "Lcom/google/firebase/auth/FirebaseUser;", "_uiState", "Lcom/guardian/safety/presentation/viewmodels/AuthUiState;", "_userProfile", "Lcom/guardian/safety/data/models/User;", "currentUser", "Lkotlinx/coroutines/flow/StateFlow;", "getCurrentUser", "()Lkotlinx/coroutines/flow/StateFlow;", "<set-?>", "", "isAuthenticated", "()Z", "setAuthenticated", "(Z)V", "isAuthenticated$delegate", "Landroidx/compose/runtime/MutableState;", "uiState", "getUiState", "userProfile", "getUserProfile", "clearError", "", "loadUserProfile", "observeAuthState", "signIn", "email", "", "password", "signOut", "signUp", "displayName", "updateUserProfile", "user", "app_debug"})
@dagger.hilt.android.lifecycle.HiltViewModel()
public final class AuthViewModel extends androidx.lifecycle.ViewModel {
    @org.jetbrains.annotations.NotNull()
    private final com.guardian.safety.data.repositories.AuthRepository authRepository = null;
    @org.jetbrains.annotations.NotNull()
    private final com.guardian.safety.data.repositories.EmergencyContactsRepository emergencyContactsRepository = null;
    @org.jetbrains.annotations.NotNull()
    private final kotlinx.coroutines.flow.MutableStateFlow<com.guardian.safety.presentation.viewmodels.AuthUiState> _uiState = null;
    @org.jetbrains.annotations.NotNull()
    private final kotlinx.coroutines.flow.StateFlow<com.guardian.safety.presentation.viewmodels.AuthUiState> uiState = null;
    @org.jetbrains.annotations.NotNull()
    private final kotlinx.coroutines.flow.MutableStateFlow<com.google.firebase.auth.FirebaseUser> _currentUser = null;
    @org.jetbrains.annotations.NotNull()
    private final kotlinx.coroutines.flow.StateFlow<com.google.firebase.auth.FirebaseUser> currentUser = null;
    @org.jetbrains.annotations.NotNull()
    private final kotlinx.coroutines.flow.MutableStateFlow<com.guardian.safety.data.models.User> _userProfile = null;
    @org.jetbrains.annotations.NotNull()
    private final kotlinx.coroutines.flow.StateFlow<com.guardian.safety.data.models.User> userProfile = null;
    @org.jetbrains.annotations.NotNull()
    private final androidx.compose.runtime.MutableState isAuthenticated$delegate = null;
    
    @javax.inject.Inject()
    public AuthViewModel(@org.jetbrains.annotations.NotNull()
    com.guardian.safety.data.repositories.AuthRepository authRepository, @org.jetbrains.annotations.NotNull()
    com.guardian.safety.data.repositories.EmergencyContactsRepository emergencyContactsRepository) {
        super();
    }
    
    @org.jetbrains.annotations.NotNull()
    public final kotlinx.coroutines.flow.StateFlow<com.guardian.safety.presentation.viewmodels.AuthUiState> getUiState() {
        return null;
    }
    
    @org.jetbrains.annotations.NotNull()
    public final kotlinx.coroutines.flow.StateFlow<com.google.firebase.auth.FirebaseUser> getCurrentUser() {
        return null;
    }
    
    @org.jetbrains.annotations.NotNull()
    public final kotlinx.coroutines.flow.StateFlow<com.guardian.safety.data.models.User> getUserProfile() {
        return null;
    }
    
    public final boolean isAuthenticated() {
        return false;
    }
    
    private final void setAuthenticated(boolean p0) {
    }
    
    private final void observeAuthState() {
    }
    
    public final void signIn(@org.jetbrains.annotations.NotNull()
    java.lang.String email, @org.jetbrains.annotations.NotNull()
    java.lang.String password) {
    }
    
    public final void signUp(@org.jetbrains.annotations.NotNull()
    java.lang.String email, @org.jetbrains.annotations.NotNull()
    java.lang.String password, @org.jetbrains.annotations.NotNull()
    java.lang.String displayName) {
    }
    
    public final void signOut() {
    }
    
    private final void loadUserProfile() {
    }
    
    public final void updateUserProfile(@org.jetbrains.annotations.NotNull()
    com.guardian.safety.data.models.User user) {
    }
    
    public final void clearError() {
    }
}