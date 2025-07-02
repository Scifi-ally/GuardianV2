package com.guardian.safety.services;

@javax.inject.Singleton()
@kotlin.Metadata(mv = {1, 9, 0}, k = 1, xi = 48, d1 = {"\u0000x\n\u0002\u0018\u0002\n\u0002\u0010\u0000\n\u0000\n\u0002\u0018\u0002\n\u0002\b\u0002\n\u0002\u0018\u0002\n\u0002\u0018\u0002\n\u0000\n\u0002\u0010\u000b\n\u0000\n\u0002\u0018\u0002\n\u0002\b\u0004\n\u0002\u0018\u0002\n\u0000\n\u0002\u0018\u0002\n\u0000\n\u0002\u0018\u0002\n\u0000\n\u0002\u0018\u0002\n\u0002\u0018\u0002\n\u0002\b\u0003\n\u0002\u0010\u0007\n\u0002\b\u0004\n\u0002\u0018\u0002\n\u0002\u0010\u0002\n\u0000\n\u0002\u0010\u000e\n\u0000\n\u0002\u0018\u0002\n\u0000\n\u0002\u0018\u0002\n\u0002\u0018\u0002\n\u0000\n\u0002\u0018\u0002\n\u0002\b\u0002\b\u0007\u0018\u00002\u00020\u0001B\u0011\b\u0007\u0012\b\b\u0001\u0010\u0002\u001a\u00020\u0003\u00a2\u0006\u0002\u0010\u0004J\u0010\u0010\f\u001a\u0004\u0018\u00010\u0017H\u0086@\u00a2\u0006\u0002\u0010\u0018J\b\u0010\u0019\u001a\u0004\u0018\u00010\u0007J\r\u0010\u001a\u001a\u0004\u0018\u00010\u001b\u00a2\u0006\u0002\u0010\u001cJ\b\u0010\u001d\u001a\u00020\tH\u0002J\u0006\u0010\u001e\u001a\u00020\tJJ\u0010\u001f\u001a\b\u0012\u0004\u0012\u00020!0 2\u0006\u0010\"\u001a\u00020#2\u0012\u0010$\u001a\u000e\u0012\u0004\u0012\u00020\u0007\u0012\u0004\u0012\u00020!0%2\u0016\u0010&\u001a\u0012\u0012\b\u0012\u00060\'j\u0002`(\u0012\u0004\u0012\u00020!0%2\b\b\u0002\u0010)\u001a\u00020*J\u0006\u0010+\u001a\u00020!R\u0016\u0010\u0005\u001a\n\u0012\u0006\u0012\u0004\u0018\u00010\u00070\u0006X\u0082\u0004\u00a2\u0006\u0002\n\u0000R\u0014\u0010\b\u001a\b\u0012\u0004\u0012\u00020\t0\u0006X\u0082\u0004\u00a2\u0006\u0002\n\u0000R\u000e\u0010\u0002\u001a\u00020\u0003X\u0082\u0004\u00a2\u0006\u0002\n\u0000R\u0019\u0010\n\u001a\n\u0012\u0006\u0012\u0004\u0018\u00010\u00070\u000b\u00a2\u0006\b\n\u0000\u001a\u0004\b\f\u0010\rR\u0017\u0010\u000e\u001a\b\u0012\u0004\u0012\u00020\t0\u000b\u00a2\u0006\b\n\u0000\u001a\u0004\b\u000e\u0010\rR\u0010\u0010\u000f\u001a\u0004\u0018\u00010\u0010X\u0082\u000e\u00a2\u0006\u0002\n\u0000R\u000e\u0010\u0011\u001a\u00020\u0012X\u0082\u0004\u00a2\u0006\u0002\n\u0000R\u000e\u0010\u0013\u001a\u00020\u0014X\u0082\u0004\u00a2\u0006\u0002\n\u0000R\u0010\u0010\u0015\u001a\u0004\u0018\u00010\u0016X\u0082\u000e\u00a2\u0006\u0002\n\u0000\u00a8\u0006,"}, d2 = {"Lcom/guardian/safety/services/RealTimeLocationService;", "", "context", "Landroid/content/Context;", "(Landroid/content/Context;)V", "_currentLocation", "Lkotlinx/coroutines/flow/MutableStateFlow;", "Lcom/guardian/safety/ui/components/LocationData;", "_isTracking", "", "currentLocation", "Lkotlinx/coroutines/flow/StateFlow;", "getCurrentLocation", "()Lkotlinx/coroutines/flow/StateFlow;", "isTracking", "locationListener", "Landroid/location/LocationListener;", "locationManager", "Landroid/location/LocationManager;", "scope", "Lkotlinx/coroutines/CoroutineScope;", "trackingJob", "Lkotlinx/coroutines/Job;", "Landroid/location/Location;", "(Lkotlin/coroutines/Continuation;)Ljava/lang/Object;", "getLastKnownLocation", "getLocationAccuracy", "", "()Ljava/lang/Float;", "hasLocationPermission", "isLocationServicesEnabled", "startTracking", "Lkotlin/Function0;", "", "userId", "", "onLocationUpdate", "Lkotlin/Function1;", "onError", "Ljava/lang/Exception;", "Lkotlin/Exception;", "options", "Lcom/guardian/safety/services/TrackingOptions;", "stopTracking", "app_debug"})
public final class RealTimeLocationService {
    @org.jetbrains.annotations.NotNull()
    private final android.content.Context context = null;
    @org.jetbrains.annotations.NotNull()
    private final android.location.LocationManager locationManager = null;
    @org.jetbrains.annotations.NotNull()
    private final kotlinx.coroutines.CoroutineScope scope = null;
    @org.jetbrains.annotations.NotNull()
    private final kotlinx.coroutines.flow.MutableStateFlow<com.guardian.safety.ui.components.LocationData> _currentLocation = null;
    @org.jetbrains.annotations.NotNull()
    private final kotlinx.coroutines.flow.StateFlow<com.guardian.safety.ui.components.LocationData> currentLocation = null;
    @org.jetbrains.annotations.NotNull()
    private final kotlinx.coroutines.flow.MutableStateFlow<java.lang.Boolean> _isTracking = null;
    @org.jetbrains.annotations.NotNull()
    private final kotlinx.coroutines.flow.StateFlow<java.lang.Boolean> isTracking = null;
    @org.jetbrains.annotations.Nullable()
    private android.location.LocationListener locationListener;
    @org.jetbrains.annotations.Nullable()
    private kotlinx.coroutines.Job trackingJob;
    
    @javax.inject.Inject()
    public RealTimeLocationService(@dagger.hilt.android.qualifiers.ApplicationContext()
    @org.jetbrains.annotations.NotNull()
    android.content.Context context) {
        super();
    }
    
    @org.jetbrains.annotations.NotNull()
    public final kotlinx.coroutines.flow.StateFlow<com.guardian.safety.ui.components.LocationData> getCurrentLocation() {
        return null;
    }
    
    @org.jetbrains.annotations.NotNull()
    public final kotlinx.coroutines.flow.StateFlow<java.lang.Boolean> isTracking() {
        return null;
    }
    
    @org.jetbrains.annotations.NotNull()
    public final kotlin.jvm.functions.Function0<kotlin.Unit> startTracking(@org.jetbrains.annotations.NotNull()
    java.lang.String userId, @org.jetbrains.annotations.NotNull()
    kotlin.jvm.functions.Function1<? super com.guardian.safety.ui.components.LocationData, kotlin.Unit> onLocationUpdate, @org.jetbrains.annotations.NotNull()
    kotlin.jvm.functions.Function1<? super java.lang.Exception, kotlin.Unit> onError, @org.jetbrains.annotations.NotNull()
    com.guardian.safety.services.TrackingOptions options) {
        return null;
    }
    
    public final void stopTracking() {
    }
    
    @org.jetbrains.annotations.Nullable()
    public final java.lang.Object getCurrentLocation(@org.jetbrains.annotations.NotNull()
    kotlin.coroutines.Continuation<? super android.location.Location> $completion) {
        return null;
    }
    
    private final boolean hasLocationPermission() {
        return false;
    }
    
    @org.jetbrains.annotations.Nullable()
    public final java.lang.Float getLocationAccuracy() {
        return null;
    }
    
    @org.jetbrains.annotations.Nullable()
    public final com.guardian.safety.ui.components.LocationData getLastKnownLocation() {
        return null;
    }
    
    public final boolean isLocationServicesEnabled() {
        return false;
    }
}