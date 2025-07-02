package com.guardian.safety.data.places;

@javax.inject.Singleton()
@kotlin.Metadata(mv = {1, 9, 0}, k = 1, xi = 48, d1 = {"\u0000H\n\u0002\u0018\u0002\n\u0002\u0010\u0000\n\u0000\n\u0002\u0018\u0002\n\u0000\n\u0002\u0018\u0002\n\u0002\b\u0002\n\u0002\u0018\u0002\n\u0002\u0010\u0002\n\u0000\n\u0002\u0018\u0002\n\u0002\b\u0004\n\u0002\u0018\u0002\n\u0002\b\u0003\n\u0002\u0010\u0006\n\u0000\n\u0002\u0018\u0002\n\u0002\b\u0002\n\u0002\u0010 \n\u0002\b\u0006\b\u0007\u0018\u00002\u00020\u0001B\u0019\b\u0007\u0012\b\b\u0001\u0010\u0002\u001a\u00020\u0003\u0012\u0006\u0010\u0004\u001a\u00020\u0005\u00a2\u0006\u0002\u0010\u0006J$\u0010\u0007\u001a\b\u0012\u0004\u0012\u00020\t0\b2\u0006\u0010\n\u001a\u00020\u000bH\u0086@\u00f8\u0001\u0000\u00f8\u0001\u0001\u00a2\u0006\u0004\b\f\u0010\rJ$\u0010\u000e\u001a\b\u0012\u0004\u0012\u00020\t0\b2\u0006\u0010\u000f\u001a\u00020\u0010H\u0086@\u00f8\u0001\u0000\u00f8\u0001\u0001\u00a2\u0006\u0004\b\u0011\u0010\u0012J\u0018\u0010\u0013\u001a\u00020\u00142\u0006\u0010\u0015\u001a\u00020\u00162\u0006\u0010\u0017\u001a\u00020\u0016H\u0002J$\u0010\u0018\u001a\b\u0012\u0004\u0012\u00020\u000b0\u00192\u0006\u0010\u001a\u001a\u00020\u00162\u0006\u0010\u001b\u001a\u00020\u0014H\u0082@\u00a2\u0006\u0002\u0010\u001cJ&\u0010\u001d\u001a\b\u0012\u0004\u0012\u00020\u000b0\u00192\u0006\u0010\u001a\u001a\u00020\u00162\b\b\u0002\u0010\u001b\u001a\u00020\u0014H\u0086@\u00a2\u0006\u0002\u0010\u001cJ&\u0010\u001e\u001a\b\u0012\u0004\u0012\u00020\u00100\u00192\u0006\u0010\u001a\u001a\u00020\u00162\b\b\u0002\u0010\u001b\u001a\u00020\u0014H\u0086@\u00a2\u0006\u0002\u0010\u001cR\u000e\u0010\u0002\u001a\u00020\u0003X\u0082\u0004\u00a2\u0006\u0002\n\u0000R\u000e\u0010\u0004\u001a\u00020\u0005X\u0082\u0004\u00a2\u0006\u0002\n\u0000\u0082\u0002\u000b\n\u0002\b!\n\u0005\b\u00a1\u001e0\u0001\u00a8\u0006\u001f"}, d2 = {"Lcom/guardian/safety/data/places/PlacesRepository;", "", "context", "Landroid/content/Context;", "firestore", "Lcom/google/firebase/firestore/FirebaseFirestore;", "(Landroid/content/Context;Lcom/google/firebase/firestore/FirebaseFirestore;)V", "addEmergencyService", "Lkotlin/Result;", "", "service", "Lcom/guardian/safety/data/model/EmergencyService;", "addEmergencyService-gIAlu-s", "(Lcom/guardian/safety/data/model/EmergencyService;Lkotlin/coroutines/Continuation;)Ljava/lang/Object;", "addSafeZone", "safeZone", "Lcom/guardian/safety/data/model/SafeZone;", "addSafeZone-gIAlu-s", "(Lcom/guardian/safety/data/model/SafeZone;Lkotlin/coroutines/Continuation;)Ljava/lang/Object;", "calculateDistance", "", "point1", "Lcom/google/android/gms/maps/model/LatLng;", "point2", "getEmergencyServicesFromGooglePlaces", "", "userLocation", "radiusKm", "(Lcom/google/android/gms/maps/model/LatLng;DLkotlin/coroutines/Continuation;)Ljava/lang/Object;", "getNearbyEmergencyServices", "getNearbySafeZones", "app_debug"})
public final class PlacesRepository {
    @org.jetbrains.annotations.NotNull()
    private final android.content.Context context = null;
    @org.jetbrains.annotations.NotNull()
    private final com.google.firebase.firestore.FirebaseFirestore firestore = null;
    
    @javax.inject.Inject()
    public PlacesRepository(@dagger.hilt.android.qualifiers.ApplicationContext()
    @org.jetbrains.annotations.NotNull()
    android.content.Context context, @org.jetbrains.annotations.NotNull()
    com.google.firebase.firestore.FirebaseFirestore firestore) {
        super();
    }
    
    @org.jetbrains.annotations.Nullable()
    public final java.lang.Object getNearbyEmergencyServices(@org.jetbrains.annotations.NotNull()
    com.google.android.gms.maps.model.LatLng userLocation, double radiusKm, @org.jetbrains.annotations.NotNull()
    kotlin.coroutines.Continuation<? super java.util.List<com.guardian.safety.data.model.EmergencyService>> $completion) {
        return null;
    }
    
    @org.jetbrains.annotations.Nullable()
    public final java.lang.Object getNearbySafeZones(@org.jetbrains.annotations.NotNull()
    com.google.android.gms.maps.model.LatLng userLocation, double radiusKm, @org.jetbrains.annotations.NotNull()
    kotlin.coroutines.Continuation<? super java.util.List<com.guardian.safety.data.model.SafeZone>> $completion) {
        return null;
    }
    
    private final java.lang.Object getEmergencyServicesFromGooglePlaces(com.google.android.gms.maps.model.LatLng userLocation, double radiusKm, kotlin.coroutines.Continuation<? super java.util.List<com.guardian.safety.data.model.EmergencyService>> $completion) {
        return null;
    }
    
    private final double calculateDistance(com.google.android.gms.maps.model.LatLng point1, com.google.android.gms.maps.model.LatLng point2) {
        return 0.0;
    }
}