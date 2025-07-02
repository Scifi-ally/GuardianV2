package com.guardian.safety.services;

@javax.inject.Singleton()
@kotlin.Metadata(mv = {1, 9, 0}, k = 1, xi = 48, d1 = {"\u00000\n\u0002\u0018\u0002\n\u0002\u0010\u0000\n\u0000\n\u0002\u0018\u0002\n\u0002\b\u0002\n\u0002\u0010\u0002\n\u0000\n\u0002\u0018\u0002\n\u0002\b\u0004\n\u0002\u0010\u000e\n\u0002\b\u0003\n\u0002\u0010\u000b\n\u0002\b\u0004\b\u0007\u0018\u0000 \u00142\u00020\u0001:\u0001\u0014B\u0011\b\u0007\u0012\b\b\u0001\u0010\u0002\u001a\u00020\u0003\u00a2\u0006\u0002\u0010\u0004J\u0006\u0010\u0005\u001a\u00020\u0006J\b\u0010\u0007\u001a\u00020\bH\u0002J\b\u0010\t\u001a\u00020\bH\u0002J\b\u0010\n\u001a\u00020\u0006H\u0002J\u0016\u0010\u000b\u001a\u00020\u00062\u0006\u0010\f\u001a\u00020\r2\u0006\u0010\u000e\u001a\u00020\rJ\u000e\u0010\u000f\u001a\u00020\u00062\u0006\u0010\u0010\u001a\u00020\u0011J\u0016\u0010\u0012\u001a\u00020\u00062\u0006\u0010\u0013\u001a\u00020\r2\u0006\u0010\u0010\u001a\u00020\u0011R\u000e\u0010\u0002\u001a\u00020\u0003X\u0082\u0004\u00a2\u0006\u0002\n\u0000\u00a8\u0006\u0015"}, d2 = {"Lcom/guardian/safety/services/NotificationService;", "", "context", "Landroid/content/Context;", "(Landroid/content/Context;)V", "cancelAllNotifications", "", "createCallActionPendingIntent", "Landroid/app/PendingIntent;", "createLocationActionPendingIntent", "createNotificationChannels", "showEmergencyReceivedNotification", "fromUser", "", "message", "showLocationSharingNotification", "isActive", "", "showSOSNotification", "userName", "Companion", "app_debug"})
public final class NotificationService {
    @org.jetbrains.annotations.NotNull()
    private final android.content.Context context = null;
    @org.jetbrains.annotations.NotNull()
    public static final java.lang.String CHANNEL_ID_EMERGENCY = "emergency_alerts";
    @org.jetbrains.annotations.NotNull()
    public static final java.lang.String CHANNEL_ID_LOCATION = "location_sharing";
    @org.jetbrains.annotations.NotNull()
    public static final java.lang.String CHANNEL_ID_GENERAL = "general_notifications";
    public static final int NOTIFICATION_ID_SOS = 1001;
    public static final int NOTIFICATION_ID_LOCATION = 1002;
    public static final int NOTIFICATION_ID_EMERGENCY_RECEIVED = 1003;
    @org.jetbrains.annotations.NotNull()
    public static final com.guardian.safety.services.NotificationService.Companion Companion = null;
    
    @javax.inject.Inject()
    public NotificationService(@dagger.hilt.android.qualifiers.ApplicationContext()
    @org.jetbrains.annotations.NotNull()
    android.content.Context context) {
        super();
    }
    
    private final void createNotificationChannels() {
    }
    
    public final void showSOSNotification(@org.jetbrains.annotations.NotNull()
    java.lang.String userName, boolean isActive) {
    }
    
    public final void showEmergencyReceivedNotification(@org.jetbrains.annotations.NotNull()
    java.lang.String fromUser, @org.jetbrains.annotations.NotNull()
    java.lang.String message) {
    }
    
    public final void showLocationSharingNotification(boolean isActive) {
    }
    
    private final android.app.PendingIntent createCallActionPendingIntent() {
        return null;
    }
    
    private final android.app.PendingIntent createLocationActionPendingIntent() {
        return null;
    }
    
    public final void cancelAllNotifications() {
    }
    
    @kotlin.Metadata(mv = {1, 9, 0}, k = 1, xi = 48, d1 = {"\u0000\u001c\n\u0002\u0018\u0002\n\u0002\u0010\u0000\n\u0002\b\u0002\n\u0002\u0010\u000e\n\u0002\b\u0003\n\u0002\u0010\b\n\u0002\b\u0003\b\u0086\u0003\u0018\u00002\u00020\u0001B\u0007\b\u0002\u00a2\u0006\u0002\u0010\u0002R\u000e\u0010\u0003\u001a\u00020\u0004X\u0086T\u00a2\u0006\u0002\n\u0000R\u000e\u0010\u0005\u001a\u00020\u0004X\u0086T\u00a2\u0006\u0002\n\u0000R\u000e\u0010\u0006\u001a\u00020\u0004X\u0086T\u00a2\u0006\u0002\n\u0000R\u000e\u0010\u0007\u001a\u00020\bX\u0086T\u00a2\u0006\u0002\n\u0000R\u000e\u0010\t\u001a\u00020\bX\u0086T\u00a2\u0006\u0002\n\u0000R\u000e\u0010\n\u001a\u00020\bX\u0086T\u00a2\u0006\u0002\n\u0000\u00a8\u0006\u000b"}, d2 = {"Lcom/guardian/safety/services/NotificationService$Companion;", "", "()V", "CHANNEL_ID_EMERGENCY", "", "CHANNEL_ID_GENERAL", "CHANNEL_ID_LOCATION", "NOTIFICATION_ID_EMERGENCY_RECEIVED", "", "NOTIFICATION_ID_LOCATION", "NOTIFICATION_ID_SOS", "app_debug"})
    public static final class Companion {
        
        private Companion() {
            super();
        }
    }
}