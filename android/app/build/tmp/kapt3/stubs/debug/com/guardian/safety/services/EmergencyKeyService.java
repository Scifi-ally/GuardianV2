package com.guardian.safety.services;

@javax.inject.Singleton()
@kotlin.Metadata(mv = {1, 9, 0}, k = 1, xi = 48, d1 = {"\u0000\u001c\n\u0002\u0018\u0002\n\u0002\u0010\u0000\n\u0002\b\u0002\n\u0002\u0010\u000e\n\u0002\b\u0007\n\u0002\u0010\u000b\n\u0002\b\u0002\b\u0007\u0018\u00002\u00020\u0001B\u0007\b\u0007\u00a2\u0006\u0002\u0010\u0002J\u001e\u0010\u0003\u001a\u00020\u00042\u0006\u0010\u0005\u001a\u00020\u00042\u0006\u0010\u0006\u001a\u00020\u00042\u0006\u0010\u0007\u001a\u00020\u0004J\u0016\u0010\b\u001a\u00020\u00042\u0006\u0010\t\u001a\u00020\u00042\u0006\u0010\n\u001a\u00020\u0001J\u000e\u0010\u000b\u001a\u00020\f2\u0006\u0010\r\u001a\u00020\u0004\u00a8\u0006\u000e"}, d2 = {"Lcom/guardian/safety/services/EmergencyKeyService;", "", "()V", "createGuardianKey", "", "uid", "name", "email", "generateShareableKey", "guardianKey", "userProfile", "validateGuardianKey", "", "key", "app_debug"})
public final class EmergencyKeyService {
    
    @javax.inject.Inject()
    public EmergencyKeyService() {
        super();
    }
    
    @org.jetbrains.annotations.NotNull()
    public final java.lang.String createGuardianKey(@org.jetbrains.annotations.NotNull()
    java.lang.String uid, @org.jetbrains.annotations.NotNull()
    java.lang.String name, @org.jetbrains.annotations.NotNull()
    java.lang.String email) {
        return null;
    }
    
    public final boolean validateGuardianKey(@org.jetbrains.annotations.NotNull()
    java.lang.String key) {
        return false;
    }
    
    @org.jetbrains.annotations.NotNull()
    public final java.lang.String generateShareableKey(@org.jetbrains.annotations.NotNull()
    java.lang.String guardianKey, @org.jetbrains.annotations.NotNull()
    java.lang.Object userProfile) {
        return null;
    }
}