package com.guardian.safety.services;

@kotlin.Metadata(mv = {1, 9, 0}, k = 1, xi = 48, d1 = {"\u0000(\n\u0002\u0018\u0002\n\u0002\u0018\u0002\n\u0002\b\u0002\n\u0002\u0018\u0002\n\u0000\n\u0002\u0010\u000e\n\u0002\b\u0002\n\u0002\u0010\u0002\n\u0000\n\u0002\u0018\u0002\n\u0002\b\b\u0018\u00002\u00020\u0001B\u0005\u00a2\u0006\u0002\u0010\u0002J\u0010\u0010\u0003\u001a\u00020\u00042\u0006\u0010\u0005\u001a\u00020\u0006H\u0002J\u0010\u0010\u0007\u001a\u00020\u00042\u0006\u0010\u0005\u001a\u00020\u0006H\u0002J\u0010\u0010\b\u001a\u00020\t2\u0006\u0010\n\u001a\u00020\u000bH\u0002J\u0010\u0010\f\u001a\u00020\t2\u0006\u0010\n\u001a\u00020\u000bH\u0002J\u0010\u0010\r\u001a\u00020\t2\u0006\u0010\n\u001a\u00020\u000bH\u0002J\u0010\u0010\u000e\u001a\u00020\t2\u0006\u0010\n\u001a\u00020\u000bH\u0002J\u0010\u0010\u000f\u001a\u00020\t2\u0006\u0010\n\u001a\u00020\u000bH\u0016J\u0010\u0010\u0010\u001a\u00020\t2\u0006\u0010\u0011\u001a\u00020\u0006H\u0016J\b\u0010\u0012\u001a\u00020\tH\u0002\u00a8\u0006\u0013"}, d2 = {"Lcom/guardian/safety/services/GuardianMessagingService;", "Lcom/google/firebase/messaging/FirebaseMessagingService;", "()V", "createAcknowledgeIntent", "Landroid/app/PendingIntent;", "alertId", "", "createNavigateIntent", "handleContactRequest", "", "remoteMessage", "Lcom/google/firebase/messaging/RemoteMessage;", "handleGeneralNotification", "handleLocationUpdate", "handleSOSAlert", "onMessageReceived", "onNewToken", "token", "triggerEmergencyVibration", "app_debug"})
public final class GuardianMessagingService extends com.google.firebase.messaging.FirebaseMessagingService {
    
    public GuardianMessagingService() {
        super();
    }
    
    @java.lang.Override()
    public void onMessageReceived(@org.jetbrains.annotations.NotNull()
    com.google.firebase.messaging.RemoteMessage remoteMessage) {
    }
    
    private final void handleSOSAlert(com.google.firebase.messaging.RemoteMessage remoteMessage) {
    }
    
    private final void handleLocationUpdate(com.google.firebase.messaging.RemoteMessage remoteMessage) {
    }
    
    private final void handleContactRequest(com.google.firebase.messaging.RemoteMessage remoteMessage) {
    }
    
    private final void handleGeneralNotification(com.google.firebase.messaging.RemoteMessage remoteMessage) {
    }
    
    private final android.app.PendingIntent createAcknowledgeIntent(java.lang.String alertId) {
        return null;
    }
    
    private final android.app.PendingIntent createNavigateIntent(java.lang.String alertId) {
        return null;
    }
    
    private final void triggerEmergencyVibration() {
    }
    
    @java.lang.Override()
    public void onNewToken(@org.jetbrains.annotations.NotNull()
    java.lang.String token) {
    }
}