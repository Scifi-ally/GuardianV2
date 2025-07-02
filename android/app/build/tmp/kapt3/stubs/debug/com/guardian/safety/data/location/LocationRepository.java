package com.guardian.safety.data.location;

@javax.inject.Singleton()
@kotlin.Metadata(mv = {1, 9, 0}, k = 1, xi = 48, d1 = {"\u0000>\n\u0002\u0018\u0002\n\u0002\u0010\u0000\n\u0000\n\u0002\u0018\u0002\n\u0002\b\u0002\n\u0002\u0018\u0002\n\u0000\n\u0002\u0018\u0002\n\u0002\u0018\u0002\n\u0002\b\u0002\n\u0002\u0010\u000b\n\u0000\n\u0002\u0010\u0002\n\u0002\b\u0002\n\u0002\u0010 \n\u0002\u0010\u000e\n\u0002\b\u0002\b\u0007\u0018\u00002\u00020\u0001B\u0011\b\u0007\u0012\b\b\u0001\u0010\u0002\u001a\u00020\u0003\u00a2\u0006\u0002\u0010\u0004J\u000e\u0010\u0007\u001a\n\u0012\u0006\u0012\u0004\u0018\u00010\t0\bJ\u000e\u0010\n\u001a\n\u0012\u0006\u0012\u0004\u0018\u00010\t0\bJ\b\u0010\u000b\u001a\u00020\fH\u0002J$\u0010\r\u001a\u00020\u000e2\u0006\u0010\u000f\u001a\u00020\t2\f\u0010\u0010\u001a\b\u0012\u0004\u0012\u00020\u00120\u0011H\u0086@\u00a2\u0006\u0002\u0010\u0013R\u000e\u0010\u0002\u001a\u00020\u0003X\u0082\u0004\u00a2\u0006\u0002\n\u0000R\u000e\u0010\u0005\u001a\u00020\u0006X\u0082\u0004\u00a2\u0006\u0002\n\u0000\u00a8\u0006\u0014"}, d2 = {"Lcom/guardian/safety/data/location/LocationRepository;", "", "context", "Landroid/content/Context;", "(Landroid/content/Context;)V", "fusedLocationClient", "Lcom/google/android/gms/location/FusedLocationProviderClient;", "getCurrentLocation", "Lkotlinx/coroutines/flow/Flow;", "Lcom/google/android/gms/maps/model/LatLng;", "getLocationUpdates", "hasLocationPermission", "", "shareLocation", "", "location", "contacts", "", "", "(Lcom/google/android/gms/maps/model/LatLng;Ljava/util/List;Lkotlin/coroutines/Continuation;)Ljava/lang/Object;", "app_debug"})
public final class LocationRepository {
    @org.jetbrains.annotations.NotNull()
    private final android.content.Context context = null;
    @org.jetbrains.annotations.NotNull()
    private final com.google.android.gms.location.FusedLocationProviderClient fusedLocationClient = null;
    
    @javax.inject.Inject()
    public LocationRepository(@dagger.hilt.android.qualifiers.ApplicationContext()
    @org.jetbrains.annotations.NotNull()
    android.content.Context context) {
        super();
    }
    
    @org.jetbrains.annotations.NotNull()
    public final kotlinx.coroutines.flow.Flow<com.google.android.gms.maps.model.LatLng> getCurrentLocation() {
        return null;
    }
    
    @org.jetbrains.annotations.NotNull()
    public final kotlinx.coroutines.flow.Flow<com.google.android.gms.maps.model.LatLng> getLocationUpdates() {
        return null;
    }
    
    private final boolean hasLocationPermission() {
        return false;
    }
    
    @org.jetbrains.annotations.Nullable()
    public final java.lang.Object shareLocation(@org.jetbrains.annotations.NotNull()
    com.google.android.gms.maps.model.LatLng location, @org.jetbrains.annotations.NotNull()
    java.util.List<java.lang.String> contacts, @org.jetbrains.annotations.NotNull()
    kotlin.coroutines.Continuation<? super kotlin.Unit> $completion) {
        return null;
    }
}