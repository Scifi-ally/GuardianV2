package com.guardian.safety.services;

@dagger.hilt.android.AndroidEntryPoint()
@kotlin.Metadata(mv = {1, 9, 0}, k = 1, xi = 48, d1 = {"\u0000`\n\u0002\u0018\u0002\n\u0002\u0018\u0002\n\u0002\b\u0002\n\u0002\u0018\u0002\n\u0002\b\u0005\n\u0002\u0018\u0002\n\u0000\n\u0002\u0018\u0002\n\u0000\n\u0002\u0018\u0002\n\u0000\n\u0002\u0018\u0002\n\u0002\b\u0005\n\u0002\u0018\u0002\n\u0000\n\u0002\u0018\u0002\n\u0002\b\u0002\n\u0002\u0018\u0002\n\u0000\n\u0002\u0018\u0002\n\u0000\n\u0002\u0010\u0002\n\u0002\b\u0002\n\u0002\u0010\b\n\u0002\b\u0004\n\u0002\u0010\u000e\n\u0002\b\u0007\b\u0007\u0018\u0000 -2\u00020\u0001:\u0001-B\u0005\u00a2\u0006\u0002\u0010\u0002J\u0010\u0010\u0017\u001a\u0004\u0018\u00010\u0018H\u0082@\u00a2\u0006\u0002\u0010\u0019J\u0014\u0010\u001a\u001a\u0004\u0018\u00010\u001b2\b\u0010\u001c\u001a\u0004\u0018\u00010\u001dH\u0016J\b\u0010\u001e\u001a\u00020\u001fH\u0016J\b\u0010 \u001a\u00020\u001fH\u0016J\"\u0010!\u001a\u00020\"2\b\u0010\u001c\u001a\u0004\u0018\u00010\u001d2\u0006\u0010#\u001a\u00020\"2\u0006\u0010$\u001a\u00020\"H\u0016J\u0010\u0010%\u001a\u00020\u001f2\u0006\u0010&\u001a\u00020\'H\u0002J\u0010\u0010(\u001a\u00020\u001f2\u0006\u0010&\u001a\u00020\'H\u0002J\b\u0010)\u001a\u00020\u001fH\u0002J\u0010\u0010*\u001a\u00020\u001f2\u0006\u0010+\u001a\u00020\'H\u0002J\b\u0010,\u001a\u00020\u001fH\u0002R\u001e\u0010\u0003\u001a\u00020\u00048\u0006@\u0006X\u0087.\u00a2\u0006\u000e\n\u0000\u001a\u0004\b\u0005\u0010\u0006\"\u0004\b\u0007\u0010\bR\u000e\u0010\t\u001a\u00020\nX\u0082.\u00a2\u0006\u0002\n\u0000R\u000e\u0010\u000b\u001a\u00020\fX\u0082\u0004\u00a2\u0006\u0002\n\u0000R\u000e\u0010\r\u001a\u00020\u000eX\u0082\u0004\u00a2\u0006\u0002\n\u0000R\u001e\u0010\u000f\u001a\u00020\u00108\u0006@\u0006X\u0087.\u00a2\u0006\u000e\n\u0000\u001a\u0004\b\u0011\u0010\u0012\"\u0004\b\u0013\u0010\u0014R\u000e\u0010\u0015\u001a\u00020\u0016X\u0082.\u00a2\u0006\u0002\n\u0000\u00a8\u0006."}, d2 = {"Lcom/guardian/safety/services/SOSAlertService;", "Landroid/app/Service;", "()V", "authRepository", "Lcom/guardian/safety/data/repositories/AuthRepository;", "getAuthRepository", "()Lcom/guardian/safety/data/repositories/AuthRepository;", "setAuthRepository", "(Lcom/guardian/safety/data/repositories/AuthRepository;)V", "fusedLocationClient", "Lcom/google/android/gms/location/FusedLocationProviderClient;", "serviceJob", "Lkotlinx/coroutines/CompletableJob;", "serviceScope", "Lkotlinx/coroutines/CoroutineScope;", "sosRepository", "Lcom/guardian/safety/data/repositories/SOSRepository;", "getSosRepository", "()Lcom/guardian/safety/data/repositories/SOSRepository;", "setSosRepository", "(Lcom/guardian/safety/data/repositories/SOSRepository;)V", "vibrator", "Landroid/os/Vibrator;", "getCurrentLocation", "Lcom/guardian/safety/data/models/Location;", "(Lkotlin/coroutines/Continuation;)Ljava/lang/Object;", "onBind", "Landroid/os/IBinder;", "intent", "Landroid/content/Intent;", "onCreate", "", "onDestroy", "onStartCommand", "", "flags", "startId", "sendSOSAlert", "message", "", "showErrorNotification", "showSuccessNotification", "startLocationTracking", "alertId", "triggerEmergencyEffects", "Companion", "app_debug"})
public final class SOSAlertService extends android.app.Service {
    @javax.inject.Inject()
    public com.guardian.safety.data.repositories.SOSRepository sosRepository;
    @javax.inject.Inject()
    public com.guardian.safety.data.repositories.AuthRepository authRepository;
    private com.google.android.gms.location.FusedLocationProviderClient fusedLocationClient;
    private android.os.Vibrator vibrator;
    @org.jetbrains.annotations.NotNull()
    private final kotlinx.coroutines.CompletableJob serviceJob = null;
    @org.jetbrains.annotations.NotNull()
    private final kotlinx.coroutines.CoroutineScope serviceScope = null;
    @org.jetbrains.annotations.NotNull()
    public static final java.lang.String ACTION_SEND_SOS = "SEND_SOS";
    @org.jetbrains.annotations.NotNull()
    public static final java.lang.String ACTION_CANCEL_SOS = "CANCEL_SOS";
    @org.jetbrains.annotations.NotNull()
    public static final java.lang.String EXTRA_MESSAGE = "MESSAGE";
    private static final int NOTIFICATION_ID = 1002;
    @org.jetbrains.annotations.NotNull()
    public static final com.guardian.safety.services.SOSAlertService.Companion Companion = null;
    
    public SOSAlertService() {
        super();
    }
    
    @org.jetbrains.annotations.NotNull()
    public final com.guardian.safety.data.repositories.SOSRepository getSosRepository() {
        return null;
    }
    
    public final void setSosRepository(@org.jetbrains.annotations.NotNull()
    com.guardian.safety.data.repositories.SOSRepository p0) {
    }
    
    @org.jetbrains.annotations.NotNull()
    public final com.guardian.safety.data.repositories.AuthRepository getAuthRepository() {
        return null;
    }
    
    public final void setAuthRepository(@org.jetbrains.annotations.NotNull()
    com.guardian.safety.data.repositories.AuthRepository p0) {
    }
    
    @java.lang.Override()
    public void onCreate() {
    }
    
    @java.lang.Override()
    public int onStartCommand(@org.jetbrains.annotations.Nullable()
    android.content.Intent intent, int flags, int startId) {
        return 0;
    }
    
    @java.lang.Override()
    @org.jetbrains.annotations.Nullable()
    public android.os.IBinder onBind(@org.jetbrains.annotations.Nullable()
    android.content.Intent intent) {
        return null;
    }
    
    private final void sendSOSAlert(java.lang.String message) {
    }
    
    private final java.lang.Object getCurrentLocation(kotlin.coroutines.Continuation<? super com.guardian.safety.data.models.Location> $completion) {
        return null;
    }
    
    private final void startLocationTracking(java.lang.String alertId) {
    }
    
    private final void triggerEmergencyEffects() {
    }
    
    private final void showSuccessNotification() {
    }
    
    private final void showErrorNotification(java.lang.String message) {
    }
    
    @java.lang.Override()
    public void onDestroy() {
    }
    
    @kotlin.Metadata(mv = {1, 9, 0}, k = 1, xi = 48, d1 = {"\u0000\u001a\n\u0002\u0018\u0002\n\u0002\u0010\u0000\n\u0002\b\u0002\n\u0002\u0010\u000e\n\u0002\b\u0003\n\u0002\u0010\b\n\u0000\b\u0086\u0003\u0018\u00002\u00020\u0001B\u0007\b\u0002\u00a2\u0006\u0002\u0010\u0002R\u000e\u0010\u0003\u001a\u00020\u0004X\u0086T\u00a2\u0006\u0002\n\u0000R\u000e\u0010\u0005\u001a\u00020\u0004X\u0086T\u00a2\u0006\u0002\n\u0000R\u000e\u0010\u0006\u001a\u00020\u0004X\u0086T\u00a2\u0006\u0002\n\u0000R\u000e\u0010\u0007\u001a\u00020\bX\u0082T\u00a2\u0006\u0002\n\u0000\u00a8\u0006\t"}, d2 = {"Lcom/guardian/safety/services/SOSAlertService$Companion;", "", "()V", "ACTION_CANCEL_SOS", "", "ACTION_SEND_SOS", "EXTRA_MESSAGE", "NOTIFICATION_ID", "", "app_debug"})
    public static final class Companion {
        
        private Companion() {
            super();
        }
    }
}