package com.guardian.safety.data.model;

@kotlin.Metadata(mv = {1, 9, 0}, k = 1, xi = 48, d1 = {"\u00002\n\u0002\u0018\u0002\n\u0002\u0010\u0000\n\u0000\n\u0002\u0010 \n\u0002\u0018\u0002\n\u0000\n\u0002\u0010\u000e\n\u0002\b\u0004\n\u0002\u0010\u000b\n\u0000\n\u0002\u0018\u0002\n\u0002\b\u0015\n\u0002\u0010\b\n\u0002\b\u0002\b\u0086\b\u0018\u00002\u00020\u0001BM\u0012\f\u0010\u0002\u001a\b\u0012\u0004\u0012\u00020\u00040\u0003\u0012\u0006\u0010\u0005\u001a\u00020\u0006\u0012\u0006\u0010\u0007\u001a\u00020\u0006\u0012\u0006\u0010\b\u001a\u00020\u0006\u0012\u0006\u0010\t\u001a\u00020\u0006\u0012\b\b\u0002\u0010\n\u001a\u00020\u000b\u0012\u000e\b\u0002\u0010\f\u001a\b\u0012\u0004\u0012\u00020\r0\u0003\u00a2\u0006\u0002\u0010\u000eJ\u000f\u0010\u0018\u001a\b\u0012\u0004\u0012\u00020\u00040\u0003H\u00c6\u0003J\t\u0010\u0019\u001a\u00020\u0006H\u00c6\u0003J\t\u0010\u001a\u001a\u00020\u0006H\u00c6\u0003J\t\u0010\u001b\u001a\u00020\u0006H\u00c6\u0003J\t\u0010\u001c\u001a\u00020\u0006H\u00c6\u0003J\t\u0010\u001d\u001a\u00020\u000bH\u00c6\u0003J\u000f\u0010\u001e\u001a\b\u0012\u0004\u0012\u00020\r0\u0003H\u00c6\u0003J[\u0010\u001f\u001a\u00020\u00002\u000e\b\u0002\u0010\u0002\u001a\b\u0012\u0004\u0012\u00020\u00040\u00032\b\b\u0002\u0010\u0005\u001a\u00020\u00062\b\b\u0002\u0010\u0007\u001a\u00020\u00062\b\b\u0002\u0010\b\u001a\u00020\u00062\b\b\u0002\u0010\t\u001a\u00020\u00062\b\b\u0002\u0010\n\u001a\u00020\u000b2\u000e\b\u0002\u0010\f\u001a\b\u0012\u0004\u0012\u00020\r0\u0003H\u00c6\u0001J\u0013\u0010 \u001a\u00020\u000b2\b\u0010!\u001a\u0004\u0018\u00010\u0001H\u00d6\u0003J\t\u0010\"\u001a\u00020#H\u00d6\u0001J\t\u0010$\u001a\u00020\u0006H\u00d6\u0001R\u0011\u0010\t\u001a\u00020\u0006\u00a2\u0006\b\n\u0000\u001a\u0004\b\u000f\u0010\u0010R\u0011\u0010\n\u001a\u00020\u000b\u00a2\u0006\b\n\u0000\u001a\u0004\b\n\u0010\u0011R\u0017\u0010\f\u001a\b\u0012\u0004\u0012\u00020\r0\u0003\u00a2\u0006\b\n\u0000\u001a\u0004\b\u0012\u0010\u0013R\u0011\u0010\b\u001a\u00020\u0006\u00a2\u0006\b\n\u0000\u001a\u0004\b\u0014\u0010\u0010R\u0017\u0010\u0002\u001a\b\u0012\u0004\u0012\u00020\u00040\u0003\u00a2\u0006\b\n\u0000\u001a\u0004\b\u0015\u0010\u0013R\u0011\u0010\u0005\u001a\u00020\u0006\u00a2\u0006\b\n\u0000\u001a\u0004\b\u0016\u0010\u0010R\u0011\u0010\u0007\u001a\u00020\u0006\u00a2\u0006\b\n\u0000\u001a\u0004\b\u0017\u0010\u0010\u00a8\u0006%"}, d2 = {"Lcom/guardian/safety/data/model/RouteDirection;", "", "steps", "", "Lcom/guardian/safety/data/model/RouteStep;", "totalDistance", "", "totalDuration", "startAddress", "endAddress", "isSafeRoute", "", "polylinePoints", "Lcom/google/android/gms/maps/model/LatLng;", "(Ljava/util/List;Ljava/lang/String;Ljava/lang/String;Ljava/lang/String;Ljava/lang/String;ZLjava/util/List;)V", "getEndAddress", "()Ljava/lang/String;", "()Z", "getPolylinePoints", "()Ljava/util/List;", "getStartAddress", "getSteps", "getTotalDistance", "getTotalDuration", "component1", "component2", "component3", "component4", "component5", "component6", "component7", "copy", "equals", "other", "hashCode", "", "toString", "app_debug"})
public final class RouteDirection {
    @org.jetbrains.annotations.NotNull()
    private final java.util.List<com.guardian.safety.data.model.RouteStep> steps = null;
    @org.jetbrains.annotations.NotNull()
    private final java.lang.String totalDistance = null;
    @org.jetbrains.annotations.NotNull()
    private final java.lang.String totalDuration = null;
    @org.jetbrains.annotations.NotNull()
    private final java.lang.String startAddress = null;
    @org.jetbrains.annotations.NotNull()
    private final java.lang.String endAddress = null;
    private final boolean isSafeRoute = false;
    @org.jetbrains.annotations.NotNull()
    private final java.util.List<com.google.android.gms.maps.model.LatLng> polylinePoints = null;
    
    public RouteDirection(@org.jetbrains.annotations.NotNull()
    java.util.List<com.guardian.safety.data.model.RouteStep> steps, @org.jetbrains.annotations.NotNull()
    java.lang.String totalDistance, @org.jetbrains.annotations.NotNull()
    java.lang.String totalDuration, @org.jetbrains.annotations.NotNull()
    java.lang.String startAddress, @org.jetbrains.annotations.NotNull()
    java.lang.String endAddress, boolean isSafeRoute, @org.jetbrains.annotations.NotNull()
    java.util.List<com.google.android.gms.maps.model.LatLng> polylinePoints) {
        super();
    }
    
    @org.jetbrains.annotations.NotNull()
    public final java.util.List<com.guardian.safety.data.model.RouteStep> getSteps() {
        return null;
    }
    
    @org.jetbrains.annotations.NotNull()
    public final java.lang.String getTotalDistance() {
        return null;
    }
    
    @org.jetbrains.annotations.NotNull()
    public final java.lang.String getTotalDuration() {
        return null;
    }
    
    @org.jetbrains.annotations.NotNull()
    public final java.lang.String getStartAddress() {
        return null;
    }
    
    @org.jetbrains.annotations.NotNull()
    public final java.lang.String getEndAddress() {
        return null;
    }
    
    public final boolean isSafeRoute() {
        return false;
    }
    
    @org.jetbrains.annotations.NotNull()
    public final java.util.List<com.google.android.gms.maps.model.LatLng> getPolylinePoints() {
        return null;
    }
    
    @org.jetbrains.annotations.NotNull()
    public final java.util.List<com.guardian.safety.data.model.RouteStep> component1() {
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
    
    @org.jetbrains.annotations.NotNull()
    public final java.lang.String component4() {
        return null;
    }
    
    @org.jetbrains.annotations.NotNull()
    public final java.lang.String component5() {
        return null;
    }
    
    public final boolean component6() {
        return false;
    }
    
    @org.jetbrains.annotations.NotNull()
    public final java.util.List<com.google.android.gms.maps.model.LatLng> component7() {
        return null;
    }
    
    @org.jetbrains.annotations.NotNull()
    public final com.guardian.safety.data.model.RouteDirection copy(@org.jetbrains.annotations.NotNull()
    java.util.List<com.guardian.safety.data.model.RouteStep> steps, @org.jetbrains.annotations.NotNull()
    java.lang.String totalDistance, @org.jetbrains.annotations.NotNull()
    java.lang.String totalDuration, @org.jetbrains.annotations.NotNull()
    java.lang.String startAddress, @org.jetbrains.annotations.NotNull()
    java.lang.String endAddress, boolean isSafeRoute, @org.jetbrains.annotations.NotNull()
    java.util.List<com.google.android.gms.maps.model.LatLng> polylinePoints) {
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