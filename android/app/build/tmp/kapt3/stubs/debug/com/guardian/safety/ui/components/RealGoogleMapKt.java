package com.guardian.safety.ui.components;

@kotlin.Metadata(mv = {1, 9, 0}, k = 2, xi = 48, d1 = {"\u0000@\n\u0000\n\u0002\u0010\u0002\n\u0000\n\u0002\u0018\u0002\n\u0000\n\u0002\u0018\u0002\n\u0002\b\u0003\n\u0002\u0018\u0002\n\u0002\b\u0002\n\u0002\u0010\u000e\n\u0000\n\u0002\u0010\u000b\n\u0000\n\u0002\u0018\u0002\n\u0000\n\u0002\u0010 \n\u0002\b\b\n\u0002\u0010\u0007\n\u0002\b\u0002\u001a.\u0010\u0000\u001a\u00020\u00012\b\b\u0002\u0010\u0002\u001a\u00020\u00032\f\u0010\u0004\u001a\b\u0012\u0004\u0012\u00020\u00010\u00052\f\u0010\u0006\u001a\b\u0012\u0004\u0012\u00020\u00010\u0005H\u0007\u001a\u00c0\u0001\u0010\u0007\u001a\u00020\u00012\b\b\u0002\u0010\u0002\u001a\u00020\u00032\b\u0010\b\u001a\u0004\u0018\u00010\t2\b\u0010\n\u001a\u0004\u0018\u00010\t2\b\b\u0002\u0010\u000b\u001a\u00020\f2\b\b\u0002\u0010\r\u001a\u00020\u000e2\u0014\b\u0002\u0010\u000f\u001a\u000e\u0012\u0004\u0012\u00020\t\u0012\u0004\u0012\u00020\u00010\u00102\u000e\b\u0002\u0010\u0011\u001a\b\u0012\u0004\u0012\u00020\t0\u00122\u000e\b\u0002\u0010\u0013\u001a\b\u0012\u0004\u0012\u00020\t0\u00122\b\b\u0002\u0010\u0014\u001a\u00020\f2\b\b\u0002\u0010\u0015\u001a\u00020\f2\b\b\u0002\u0010\u0016\u001a\u00020\u000e2\b\b\u0002\u0010\u0017\u001a\u00020\u000e2\b\b\u0002\u0010\u0018\u001a\u00020\u000e2\b\b\u0002\u0010\u0019\u001a\u00020\u000e2\b\b\u0002\u0010\u001a\u001a\u00020\u001b2\b\b\u0002\u0010\u001c\u001a\u00020\u000eH\u0007\u00a8\u0006\u001d"}, d2 = {"MapControls", "", "modifier", "Landroidx/compose/ui/Modifier;", "onMyLocationClick", "Lkotlin/Function0;", "onMapTypeToggle", "RealGoogleMap", "userLocation", "Lcom/google/android/gms/maps/model/LatLng;", "destination", "travelMode", "", "isNavigating", "", "onMapClick", "Lkotlin/Function1;", "emergencyServices", "", "safeZones", "mapTheme", "mapType", "showTraffic", "showSafeZones", "showEmergencyServices", "enableSatelliteView", "zoomLevel", "", "trackUserLocation", "app_debug"})
public final class RealGoogleMapKt {
    
    @androidx.compose.runtime.Composable()
    public static final void RealGoogleMap(@org.jetbrains.annotations.NotNull()
    androidx.compose.ui.Modifier modifier, @org.jetbrains.annotations.Nullable()
    com.google.android.gms.maps.model.LatLng userLocation, @org.jetbrains.annotations.Nullable()
    com.google.android.gms.maps.model.LatLng destination, @org.jetbrains.annotations.NotNull()
    java.lang.String travelMode, boolean isNavigating, @org.jetbrains.annotations.NotNull()
    kotlin.jvm.functions.Function1<? super com.google.android.gms.maps.model.LatLng, kotlin.Unit> onMapClick, @org.jetbrains.annotations.NotNull()
    java.util.List<com.google.android.gms.maps.model.LatLng> emergencyServices, @org.jetbrains.annotations.NotNull()
    java.util.List<com.google.android.gms.maps.model.LatLng> safeZones, @org.jetbrains.annotations.NotNull()
    java.lang.String mapTheme, @org.jetbrains.annotations.NotNull()
    java.lang.String mapType, boolean showTraffic, boolean showSafeZones, boolean showEmergencyServices, boolean enableSatelliteView, float zoomLevel, boolean trackUserLocation) {
    }
    
    @androidx.compose.runtime.Composable()
    public static final void MapControls(@org.jetbrains.annotations.NotNull()
    androidx.compose.ui.Modifier modifier, @org.jetbrains.annotations.NotNull()
    kotlin.jvm.functions.Function0<kotlin.Unit> onMyLocationClick, @org.jetbrains.annotations.NotNull()
    kotlin.jvm.functions.Function0<kotlin.Unit> onMapTypeToggle) {
    }
}