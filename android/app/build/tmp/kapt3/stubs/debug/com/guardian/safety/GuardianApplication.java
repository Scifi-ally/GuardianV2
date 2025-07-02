package com.guardian.safety;

@dagger.hilt.android.HiltAndroidApp()
@kotlin.Metadata(mv = {1, 9, 0}, k = 1, xi = 48, d1 = {"\u0000\f\n\u0002\u0018\u0002\n\u0002\u0018\u0002\n\u0002\b\u0003\b\u0007\u0018\u0000 \u00032\u00020\u0001:\u0001\u0003B\u0005\u00a2\u0006\u0002\u0010\u0002\u00a8\u0006\u0004"}, d2 = {"Lcom/guardian/safety/GuardianApplication;", "Landroid/app/Application;", "()V", "Companion", "app_debug"})
public final class GuardianApplication extends android.app.Application {
    @org.jetbrains.annotations.NotNull()
    public static final java.lang.String SOS_CHANNEL_ID = "sos_channel";
    @org.jetbrains.annotations.NotNull()
    public static final java.lang.String GENERAL_CHANNEL_ID = "general_channel";
    @org.jetbrains.annotations.NotNull()
    public static final java.lang.String LOCATION_CHANNEL_ID = "location_channel";
    @org.jetbrains.annotations.NotNull()
    public static final com.guardian.safety.GuardianApplication.Companion Companion = null;
    
    public GuardianApplication() {
        super();
    }
    
    @kotlin.Metadata(mv = {1, 9, 0}, k = 1, xi = 48, d1 = {"\u0000\u0014\n\u0002\u0018\u0002\n\u0002\u0010\u0000\n\u0002\b\u0002\n\u0002\u0010\u000e\n\u0002\b\u0003\b\u0086\u0003\u0018\u00002\u00020\u0001B\u0007\b\u0002\u00a2\u0006\u0002\u0010\u0002R\u000e\u0010\u0003\u001a\u00020\u0004X\u0086T\u00a2\u0006\u0002\n\u0000R\u000e\u0010\u0005\u001a\u00020\u0004X\u0086T\u00a2\u0006\u0002\n\u0000R\u000e\u0010\u0006\u001a\u00020\u0004X\u0086T\u00a2\u0006\u0002\n\u0000\u00a8\u0006\u0007"}, d2 = {"Lcom/guardian/safety/GuardianApplication$Companion;", "", "()V", "GENERAL_CHANNEL_ID", "", "LOCATION_CHANNEL_ID", "SOS_CHANNEL_ID", "app_debug"})
    public static final class Companion {
        
        private Companion() {
            super();
        }
    }
}