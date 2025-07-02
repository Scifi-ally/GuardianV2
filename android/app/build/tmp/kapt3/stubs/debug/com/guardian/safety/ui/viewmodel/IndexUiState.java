package com.guardian.safety.ui.viewmodel;

@kotlin.Metadata(mv = {1, 9, 0}, k = 1, xi = 48, d1 = {"\u0000L\n\u0002\u0018\u0002\n\u0002\u0010\u0000\n\u0000\n\u0002\u0010\u000e\n\u0002\b\u0003\n\u0002\u0010\u000b\n\u0002\b\u0002\n\u0002\u0018\u0002\n\u0002\b\u0002\n\u0002\u0018\u0002\n\u0000\n\u0002\u0010 \n\u0002\b\u0002\n\u0002\u0018\u0002\n\u0000\n\u0002\u0018\u0002\n\u0000\n\u0002\u0018\u0002\n\u0002\b*\n\u0002\u0010\b\n\u0002\b\u0002\b\u0086\b\u0018\u00002\u00020\u0001B\u00bd\u0001\u0012\b\b\u0002\u0010\u0002\u001a\u00020\u0003\u0012\b\b\u0002\u0010\u0004\u001a\u00020\u0003\u0012\b\b\u0002\u0010\u0005\u001a\u00020\u0003\u0012\b\b\u0002\u0010\u0006\u001a\u00020\u0007\u0012\b\b\u0002\u0010\b\u001a\u00020\u0003\u0012\n\b\u0002\u0010\t\u001a\u0004\u0018\u00010\n\u0012\b\b\u0002\u0010\u000b\u001a\u00020\u0007\u0012\b\b\u0002\u0010\f\u001a\u00020\r\u0012\u000e\b\u0002\u0010\u000e\u001a\b\u0012\u0004\u0012\u00020\n0\u000f\u0012\u000e\b\u0002\u0010\u0010\u001a\b\u0012\u0004\u0012\u00020\n0\u000f\u0012\u000e\b\u0002\u0010\u0011\u001a\b\u0012\u0004\u0012\u00020\u00120\u000f\u0012\u000e\b\u0002\u0010\u0013\u001a\b\u0012\u0004\u0012\u00020\u00140\u000f\u0012\n\b\u0002\u0010\u0015\u001a\u0004\u0018\u00010\u0016\u0012\u000e\b\u0002\u0010\u0017\u001a\b\u0012\u0004\u0012\u00020\u00030\u000f\u0012\b\b\u0002\u0010\u0018\u001a\u00020\u0003\u00a2\u0006\u0002\u0010\u0019J\t\u0010.\u001a\u00020\u0003H\u00c6\u0003J\u000f\u0010/\u001a\b\u0012\u0004\u0012\u00020\n0\u000fH\u00c6\u0003J\u000f\u00100\u001a\b\u0012\u0004\u0012\u00020\u00120\u000fH\u00c6\u0003J\u000f\u00101\u001a\b\u0012\u0004\u0012\u00020\u00140\u000fH\u00c6\u0003J\u000b\u00102\u001a\u0004\u0018\u00010\u0016H\u00c6\u0003J\u000f\u00103\u001a\b\u0012\u0004\u0012\u00020\u00030\u000fH\u00c6\u0003J\t\u00104\u001a\u00020\u0003H\u00c6\u0003J\t\u00105\u001a\u00020\u0003H\u00c6\u0003J\t\u00106\u001a\u00020\u0003H\u00c6\u0003J\t\u00107\u001a\u00020\u0007H\u00c6\u0003J\t\u00108\u001a\u00020\u0003H\u00c6\u0003J\u000b\u00109\u001a\u0004\u0018\u00010\nH\u00c6\u0003J\t\u0010:\u001a\u00020\u0007H\u00c6\u0003J\t\u0010;\u001a\u00020\rH\u00c6\u0003J\u000f\u0010<\u001a\b\u0012\u0004\u0012\u00020\n0\u000fH\u00c6\u0003J\u00c1\u0001\u0010=\u001a\u00020\u00002\b\b\u0002\u0010\u0002\u001a\u00020\u00032\b\b\u0002\u0010\u0004\u001a\u00020\u00032\b\b\u0002\u0010\u0005\u001a\u00020\u00032\b\b\u0002\u0010\u0006\u001a\u00020\u00072\b\b\u0002\u0010\b\u001a\u00020\u00032\n\b\u0002\u0010\t\u001a\u0004\u0018\u00010\n2\b\b\u0002\u0010\u000b\u001a\u00020\u00072\b\b\u0002\u0010\f\u001a\u00020\r2\u000e\b\u0002\u0010\u000e\u001a\b\u0012\u0004\u0012\u00020\n0\u000f2\u000e\b\u0002\u0010\u0010\u001a\b\u0012\u0004\u0012\u00020\n0\u000f2\u000e\b\u0002\u0010\u0011\u001a\b\u0012\u0004\u0012\u00020\u00120\u000f2\u000e\b\u0002\u0010\u0013\u001a\b\u0012\u0004\u0012\u00020\u00140\u000f2\n\b\u0002\u0010\u0015\u001a\u0004\u0018\u00010\u00162\u000e\b\u0002\u0010\u0017\u001a\b\u0012\u0004\u0012\u00020\u00030\u000f2\b\b\u0002\u0010\u0018\u001a\u00020\u0003H\u00c6\u0001J\u0013\u0010>\u001a\u00020\u00072\b\u0010?\u001a\u0004\u0018\u00010\u0001H\u00d6\u0003J\t\u0010@\u001a\u00020AH\u00d6\u0001J\t\u0010B\u001a\u00020\u0003H\u00d6\u0001R\u0013\u0010\u0015\u001a\u0004\u0018\u00010\u0016\u00a2\u0006\b\n\u0000\u001a\u0004\b\u001a\u0010\u001bR\u0013\u0010\t\u001a\u0004\u0018\u00010\n\u00a2\u0006\b\n\u0000\u001a\u0004\b\u001c\u0010\u001dR\u0017\u0010\u0011\u001a\b\u0012\u0004\u0012\u00020\u00120\u000f\u00a2\u0006\b\n\u0000\u001a\u0004\b\u001e\u0010\u001fR\u0011\u0010\u0002\u001a\u00020\u0003\u00a2\u0006\b\n\u0000\u001a\u0004\b \u0010!R\u0011\u0010\u0006\u001a\u00020\u0007\u00a2\u0006\b\n\u0000\u001a\u0004\b\u0006\u0010\"R\u0017\u0010\u000e\u001a\b\u0012\u0004\u0012\u00020\n0\u000f\u00a2\u0006\b\n\u0000\u001a\u0004\b#\u0010\u001fR\u0017\u0010\u0010\u001a\b\u0012\u0004\u0012\u00020\n0\u000f\u00a2\u0006\b\n\u0000\u001a\u0004\b$\u0010\u001fR\u0011\u0010\f\u001a\u00020\r\u00a2\u0006\b\n\u0000\u001a\u0004\b%\u0010&R\u0017\u0010\u0017\u001a\b\u0012\u0004\u0012\u00020\u00030\u000f\u00a2\u0006\b\n\u0000\u001a\u0004\b\'\u0010\u001fR\u0011\u0010\u0018\u001a\u00020\u0003\u00a2\u0006\b\n\u0000\u001a\u0004\b(\u0010!R\u0017\u0010\u0013\u001a\b\u0012\u0004\u0012\u00020\u00140\u000f\u00a2\u0006\b\n\u0000\u001a\u0004\b)\u0010\u001fR\u0011\u0010\b\u001a\u00020\u0003\u00a2\u0006\b\n\u0000\u001a\u0004\b*\u0010!R\u0011\u0010\u000b\u001a\u00020\u0007\u00a2\u0006\b\n\u0000\u001a\u0004\b+\u0010\"R\u0011\u0010\u0004\u001a\u00020\u0003\u00a2\u0006\b\n\u0000\u001a\u0004\b,\u0010!R\u0011\u0010\u0005\u001a\u00020\u0003\u00a2\u0006\b\n\u0000\u001a\u0004\b-\u0010!\u00a8\u0006C"}, d2 = {"Lcom/guardian/safety/ui/viewmodel/IndexUiState;", "", "fromLocation", "", "toLocation", "travelMode", "isNavigating", "", "selectedTab", "destination", "Lcom/google/android/gms/maps/model/LatLng;", "sosActive", "routeSettings", "Lcom/guardian/safety/ui/viewmodel/RouteSettings;", "nearbyEmergencyServices", "", "nearbySafeZones", "emergencyServices", "Lcom/guardian/safety/data/model/EmergencyService;", "safeZones", "Lcom/guardian/safety/data/model/SafeZone;", "currentRoute", "Lcom/guardian/safety/data/model/RouteDirection;", "routeSteps", "routeSummary", "(Ljava/lang/String;Ljava/lang/String;Ljava/lang/String;ZLjava/lang/String;Lcom/google/android/gms/maps/model/LatLng;ZLcom/guardian/safety/ui/viewmodel/RouteSettings;Ljava/util/List;Ljava/util/List;Ljava/util/List;Ljava/util/List;Lcom/guardian/safety/data/model/RouteDirection;Ljava/util/List;Ljava/lang/String;)V", "getCurrentRoute", "()Lcom/guardian/safety/data/model/RouteDirection;", "getDestination", "()Lcom/google/android/gms/maps/model/LatLng;", "getEmergencyServices", "()Ljava/util/List;", "getFromLocation", "()Ljava/lang/String;", "()Z", "getNearbyEmergencyServices", "getNearbySafeZones", "getRouteSettings", "()Lcom/guardian/safety/ui/viewmodel/RouteSettings;", "getRouteSteps", "getRouteSummary", "getSafeZones", "getSelectedTab", "getSosActive", "getToLocation", "getTravelMode", "component1", "component10", "component11", "component12", "component13", "component14", "component15", "component2", "component3", "component4", "component5", "component6", "component7", "component8", "component9", "copy", "equals", "other", "hashCode", "", "toString", "app_debug"})
public final class IndexUiState {
    @org.jetbrains.annotations.NotNull()
    private final java.lang.String fromLocation = null;
    @org.jetbrains.annotations.NotNull()
    private final java.lang.String toLocation = null;
    @org.jetbrains.annotations.NotNull()
    private final java.lang.String travelMode = null;
    private final boolean isNavigating = false;
    @org.jetbrains.annotations.NotNull()
    private final java.lang.String selectedTab = null;
    @org.jetbrains.annotations.Nullable()
    private final com.google.android.gms.maps.model.LatLng destination = null;
    private final boolean sosActive = false;
    @org.jetbrains.annotations.NotNull()
    private final com.guardian.safety.ui.viewmodel.RouteSettings routeSettings = null;
    @org.jetbrains.annotations.NotNull()
    private final java.util.List<com.google.android.gms.maps.model.LatLng> nearbyEmergencyServices = null;
    @org.jetbrains.annotations.NotNull()
    private final java.util.List<com.google.android.gms.maps.model.LatLng> nearbySafeZones = null;
    @org.jetbrains.annotations.NotNull()
    private final java.util.List<com.guardian.safety.data.model.EmergencyService> emergencyServices = null;
    @org.jetbrains.annotations.NotNull()
    private final java.util.List<com.guardian.safety.data.model.SafeZone> safeZones = null;
    @org.jetbrains.annotations.Nullable()
    private final com.guardian.safety.data.model.RouteDirection currentRoute = null;
    @org.jetbrains.annotations.NotNull()
    private final java.util.List<java.lang.String> routeSteps = null;
    @org.jetbrains.annotations.NotNull()
    private final java.lang.String routeSummary = null;
    
    public IndexUiState(@org.jetbrains.annotations.NotNull()
    java.lang.String fromLocation, @org.jetbrains.annotations.NotNull()
    java.lang.String toLocation, @org.jetbrains.annotations.NotNull()
    java.lang.String travelMode, boolean isNavigating, @org.jetbrains.annotations.NotNull()
    java.lang.String selectedTab, @org.jetbrains.annotations.Nullable()
    com.google.android.gms.maps.model.LatLng destination, boolean sosActive, @org.jetbrains.annotations.NotNull()
    com.guardian.safety.ui.viewmodel.RouteSettings routeSettings, @org.jetbrains.annotations.NotNull()
    java.util.List<com.google.android.gms.maps.model.LatLng> nearbyEmergencyServices, @org.jetbrains.annotations.NotNull()
    java.util.List<com.google.android.gms.maps.model.LatLng> nearbySafeZones, @org.jetbrains.annotations.NotNull()
    java.util.List<com.guardian.safety.data.model.EmergencyService> emergencyServices, @org.jetbrains.annotations.NotNull()
    java.util.List<com.guardian.safety.data.model.SafeZone> safeZones, @org.jetbrains.annotations.Nullable()
    com.guardian.safety.data.model.RouteDirection currentRoute, @org.jetbrains.annotations.NotNull()
    java.util.List<java.lang.String> routeSteps, @org.jetbrains.annotations.NotNull()
    java.lang.String routeSummary) {
        super();
    }
    
    @org.jetbrains.annotations.NotNull()
    public final java.lang.String getFromLocation() {
        return null;
    }
    
    @org.jetbrains.annotations.NotNull()
    public final java.lang.String getToLocation() {
        return null;
    }
    
    @org.jetbrains.annotations.NotNull()
    public final java.lang.String getTravelMode() {
        return null;
    }
    
    public final boolean isNavigating() {
        return false;
    }
    
    @org.jetbrains.annotations.NotNull()
    public final java.lang.String getSelectedTab() {
        return null;
    }
    
    @org.jetbrains.annotations.Nullable()
    public final com.google.android.gms.maps.model.LatLng getDestination() {
        return null;
    }
    
    public final boolean getSosActive() {
        return false;
    }
    
    @org.jetbrains.annotations.NotNull()
    public final com.guardian.safety.ui.viewmodel.RouteSettings getRouteSettings() {
        return null;
    }
    
    @org.jetbrains.annotations.NotNull()
    public final java.util.List<com.google.android.gms.maps.model.LatLng> getNearbyEmergencyServices() {
        return null;
    }
    
    @org.jetbrains.annotations.NotNull()
    public final java.util.List<com.google.android.gms.maps.model.LatLng> getNearbySafeZones() {
        return null;
    }
    
    @org.jetbrains.annotations.NotNull()
    public final java.util.List<com.guardian.safety.data.model.EmergencyService> getEmergencyServices() {
        return null;
    }
    
    @org.jetbrains.annotations.NotNull()
    public final java.util.List<com.guardian.safety.data.model.SafeZone> getSafeZones() {
        return null;
    }
    
    @org.jetbrains.annotations.Nullable()
    public final com.guardian.safety.data.model.RouteDirection getCurrentRoute() {
        return null;
    }
    
    @org.jetbrains.annotations.NotNull()
    public final java.util.List<java.lang.String> getRouteSteps() {
        return null;
    }
    
    @org.jetbrains.annotations.NotNull()
    public final java.lang.String getRouteSummary() {
        return null;
    }
    
    public IndexUiState() {
        super();
    }
    
    @org.jetbrains.annotations.NotNull()
    public final java.lang.String component1() {
        return null;
    }
    
    @org.jetbrains.annotations.NotNull()
    public final java.util.List<com.google.android.gms.maps.model.LatLng> component10() {
        return null;
    }
    
    @org.jetbrains.annotations.NotNull()
    public final java.util.List<com.guardian.safety.data.model.EmergencyService> component11() {
        return null;
    }
    
    @org.jetbrains.annotations.NotNull()
    public final java.util.List<com.guardian.safety.data.model.SafeZone> component12() {
        return null;
    }
    
    @org.jetbrains.annotations.Nullable()
    public final com.guardian.safety.data.model.RouteDirection component13() {
        return null;
    }
    
    @org.jetbrains.annotations.NotNull()
    public final java.util.List<java.lang.String> component14() {
        return null;
    }
    
    @org.jetbrains.annotations.NotNull()
    public final java.lang.String component15() {
        return null;
    }
    
    @org.jetbrains.annotations.NotNull()
    public final java.lang.String component2() {
        return null;
    }
    
    @org.jetbrains.annotations.NotNull()
    public final java.lang.String component3() {
        return null;
    }
    
    public final boolean component4() {
        return false;
    }
    
    @org.jetbrains.annotations.NotNull()
    public final java.lang.String component5() {
        return null;
    }
    
    @org.jetbrains.annotations.Nullable()
    public final com.google.android.gms.maps.model.LatLng component6() {
        return null;
    }
    
    public final boolean component7() {
        return false;
    }
    
    @org.jetbrains.annotations.NotNull()
    public final com.guardian.safety.ui.viewmodel.RouteSettings component8() {
        return null;
    }
    
    @org.jetbrains.annotations.NotNull()
    public final java.util.List<com.google.android.gms.maps.model.LatLng> component9() {
        return null;
    }
    
    @org.jetbrains.annotations.NotNull()
    public final com.guardian.safety.ui.viewmodel.IndexUiState copy(@org.jetbrains.annotations.NotNull()
    java.lang.String fromLocation, @org.jetbrains.annotations.NotNull()
    java.lang.String toLocation, @org.jetbrains.annotations.NotNull()
    java.lang.String travelMode, boolean isNavigating, @org.jetbrains.annotations.NotNull()
    java.lang.String selectedTab, @org.jetbrains.annotations.Nullable()
    com.google.android.gms.maps.model.LatLng destination, boolean sosActive, @org.jetbrains.annotations.NotNull()
    com.guardian.safety.ui.viewmodel.RouteSettings routeSettings, @org.jetbrains.annotations.NotNull()
    java.util.List<com.google.android.gms.maps.model.LatLng> nearbyEmergencyServices, @org.jetbrains.annotations.NotNull()
    java.util.List<com.google.android.gms.maps.model.LatLng> nearbySafeZones, @org.jetbrains.annotations.NotNull()
    java.util.List<com.guardian.safety.data.model.EmergencyService> emergencyServices, @org.jetbrains.annotations.NotNull()
    java.util.List<com.guardian.safety.data.model.SafeZone> safeZones, @org.jetbrains.annotations.Nullable()
    com.guardian.safety.data.model.RouteDirection currentRoute, @org.jetbrains.annotations.NotNull()
    java.util.List<java.lang.String> routeSteps, @org.jetbrains.annotations.NotNull()
    java.lang.String routeSummary) {
        return null;
    }
    
    @java.lang.Override()
    public boolean equals(@org.jetbrains.annotations.Nullable()
    java.lang.Object other) {
        return false;
    }
    
    @java.lang.Override()
    public int hashCode() {
        return 0;
    }
    
    @java.lang.Override()
    @org.jetbrains.annotations.NotNull()
    public java.lang.String toString() {
        return null;
    }
}