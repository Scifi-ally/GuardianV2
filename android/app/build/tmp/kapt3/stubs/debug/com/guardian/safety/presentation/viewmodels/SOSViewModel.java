package com.guardian.safety.presentation.viewmodels;

@kotlin.Metadata(mv = {1, 9, 0}, k = 1, xi = 48, d1 = {"\u0000F\n\u0002\u0018\u0002\n\u0002\u0018\u0002\n\u0000\n\u0002\u0018\u0002\n\u0002\b\u0002\n\u0002\u0018\u0002\n\u0002\u0010 \n\u0002\u0018\u0002\n\u0002\b\u0002\n\u0002\u0018\u0002\n\u0000\n\u0002\u0018\u0002\n\u0002\b\u0007\n\u0002\u0010\u0002\n\u0000\n\u0002\u0010\u000e\n\u0002\b\u0007\n\u0002\u0018\u0002\n\u0002\b\u0003\b\u0007\u0018\u00002\u00020\u0001B\u000f\b\u0007\u0012\u0006\u0010\u0002\u001a\u00020\u0003\u00a2\u0006\u0002\u0010\u0004J\u0016\u0010\u0014\u001a\u00020\u00152\u0006\u0010\u0016\u001a\u00020\u00172\u0006\u0010\u0018\u001a\u00020\u0017J\u0006\u0010\u0019\u001a\u00020\u0015J\u000e\u0010\u001a\u001a\u00020\u00152\u0006\u0010\u0018\u001a\u00020\u0017J\u000e\u0010\u001b\u001a\u00020\u00152\u0006\u0010\u0018\u001a\u00020\u0017J\u000e\u0010\u001c\u001a\u00020\u00152\u0006\u0010\u0016\u001a\u00020\u0017J\u0018\u0010\u001d\u001a\u00020\u00152\u0006\u0010\u001e\u001a\u00020\u001f2\u0006\u0010 \u001a\u00020\u0017H\u0002J\u0018\u0010!\u001a\u00020\u00152\u0006\u0010\u001e\u001a\u00020\u001f2\b\b\u0002\u0010 \u001a\u00020\u0017R\u001a\u0010\u0005\u001a\u000e\u0012\n\u0012\b\u0012\u0004\u0012\u00020\b0\u00070\u0006X\u0082\u0004\u00a2\u0006\u0002\n\u0000R\u001a\u0010\t\u001a\u000e\u0012\n\u0012\b\u0012\u0004\u0012\u00020\b0\u00070\u0006X\u0082\u0004\u00a2\u0006\u0002\n\u0000R\u0014\u0010\n\u001a\b\u0012\u0004\u0012\u00020\u000b0\u0006X\u0082\u0004\u00a2\u0006\u0002\n\u0000R\u001d\u0010\f\u001a\u000e\u0012\n\u0012\b\u0012\u0004\u0012\u00020\b0\u00070\r\u00a2\u0006\b\n\u0000\u001a\u0004\b\u000e\u0010\u000fR\u001d\u0010\u0010\u001a\u000e\u0012\n\u0012\b\u0012\u0004\u0012\u00020\b0\u00070\r\u00a2\u0006\b\n\u0000\u001a\u0004\b\u0011\u0010\u000fR\u000e\u0010\u0002\u001a\u00020\u0003X\u0082\u0004\u00a2\u0006\u0002\n\u0000R\u0017\u0010\u0012\u001a\b\u0012\u0004\u0012\u00020\u000b0\r\u00a2\u0006\b\n\u0000\u001a\u0004\b\u0013\u0010\u000f\u00a8\u0006\""}, d2 = {"Lcom/guardian/safety/presentation/viewmodels/SOSViewModel;", "Landroidx/lifecycle/ViewModel;", "sosRepository", "Lcom/guardian/safety/data/repositories/SOSRepository;", "(Lcom/guardian/safety/data/repositories/SOSRepository;)V", "_receivedAlerts", "Lkotlinx/coroutines/flow/MutableStateFlow;", "", "Lcom/guardian/safety/data/models/SOSAlert;", "_sentAlerts", "_uiState", "Lcom/guardian/safety/presentation/viewmodels/SOSUiState;", "receivedAlerts", "Lkotlinx/coroutines/flow/StateFlow;", "getReceivedAlerts", "()Lkotlinx/coroutines/flow/StateFlow;", "sentAlerts", "getSentAlerts", "uiState", "getUiState", "acknowledgeAlert", "", "alertId", "", "userId", "cancelSOS", "loadReceivedAlerts", "loadSentAlerts", "resolveAlert", "sendSOSAlert", "context", "Landroid/content/Context;", "message", "startSOSCountdown", "app_debug"})
@dagger.hilt.android.lifecycle.HiltViewModel()
public final class SOSViewModel extends androidx.lifecycle.ViewModel {
    @org.jetbrains.annotations.NotNull()
    private final com.guardian.safety.data.repositories.SOSRepository sosRepository = null;
    @org.jetbrains.annotations.NotNull()
    private final kotlinx.coroutines.flow.MutableStateFlow<com.guardian.safety.presentation.viewmodels.SOSUiState> _uiState = null;
    @org.jetbrains.annotations.NotNull()
    private final kotlinx.coroutines.flow.StateFlow<com.guardian.safety.presentation.viewmodels.SOSUiState> uiState = null;
    @org.jetbrains.annotations.NotNull()
    private final kotlinx.coroutines.flow.MutableStateFlow<java.util.List<com.guardian.safety.data.models.SOSAlert>> _receivedAlerts = null;
    @org.jetbrains.annotations.NotNull()
    private final kotlinx.coroutines.flow.StateFlow<java.util.List<com.guardian.safety.data.models.SOSAlert>> receivedAlerts = null;
    @org.jetbrains.annotations.NotNull()
    private final kotlinx.coroutines.flow.MutableStateFlow<java.util.List<com.guardian.safety.data.models.SOSAlert>> _sentAlerts = null;
    @org.jetbrains.annotations.NotNull()
    private final kotlinx.coroutines.flow.StateFlow<java.util.List<com.guardian.safety.data.models.SOSAlert>> sentAlerts = null;
    
    @javax.inject.Inject()
    public SOSViewModel(@org.jetbrains.annotations.NotNull()
    com.guardian.safety.data.repositories.SOSRepository sosRepository) {
        super();
    }
    
    @org.jetbrains.annotations.NotNull()
    public final kotlinx.coroutines.flow.StateFlow<com.guardian.safety.presentation.viewmodels.SOSUiState> getUiState() {
        return null;
    }
    
    @org.jetbrains.annotations.NotNull()
    public final kotlinx.coroutines.flow.StateFlow<java.util.List<com.guardian.safety.data.models.SOSAlert>> getReceivedAlerts() {
        return null;
    }
    
    @org.jetbrains.annotations.NotNull()
    public final kotlinx.coroutines.flow.StateFlow<java.util.List<com.guardian.safety.data.models.SOSAlert>> getSentAlerts() {
        return null;
    }
    
    public final void startSOSCountdown(@org.jetbrains.annotations.NotNull()
    android.content.Context context, @org.jetbrains.annotations.NotNull()
    java.lang.String message) {
    }
    
    public final void cancelSOS() {
    }
    
    private final void sendSOSAlert(android.content.Context context, java.lang.String message) {
    }
    
    public final void loadReceivedAlerts(@org.jetbrains.annotations.NotNull()
    java.lang.String userId) {
    }
    
    public final void loadSentAlerts(@org.jetbrains.annotations.NotNull()
    java.lang.String userId) {
    }
    
    public final void acknowledgeAlert(@org.jetbrains.annotations.NotNull()
    java.lang.String alertId, @org.jetbrains.annotations.NotNull()
    java.lang.String userId) {
    }
    
    public final void resolveAlert(@org.jetbrains.annotations.NotNull()
    java.lang.String alertId) {
    }
}