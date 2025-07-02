package com.guardian.safety.data.routing;

@javax.inject.Singleton()
@kotlin.Metadata(mv = {1, 9, 0}, k = 1, xi = 48, d1 = {"\u0000\\\n\u0002\u0018\u0002\n\u0002\u0010\u0000\n\u0000\n\u0002\u0018\u0002\n\u0000\n\u0002\u0018\u0002\n\u0002\b\u0002\n\u0002\u0010\u000e\n\u0000\n\u0002\u0018\u0002\n\u0002\b\u0003\n\u0002\u0010\u000b\n\u0002\b\u0003\n\u0002\u0010 \n\u0002\b\u0003\n\u0002\u0018\u0002\n\u0000\n\u0002\u0018\u0002\n\u0002\u0018\u0002\n\u0002\b\n\n\u0002\u0010\u0002\n\u0002\b\u0002\n\u0002\u0010\b\n\u0000\n\u0002\u0018\u0002\n\u0000\b\u0007\u0018\u00002\u00020\u0001B\u0019\b\u0007\u0012\b\b\u0001\u0010\u0002\u001a\u00020\u0003\u0012\u0006\u0010\u0004\u001a\u00020\u0005\u00a2\u0006\u0002\u0010\u0006J8\u0010\u0007\u001a\u00020\b2\u0006\u0010\t\u001a\u00020\n2\u0006\u0010\u000b\u001a\u00020\n2\u0006\u0010\f\u001a\u00020\b2\u0006\u0010\r\u001a\u00020\u000e2\u0006\u0010\u000f\u001a\u00020\u000e2\u0006\u0010\u0010\u001a\u00020\bH\u0002J\u0016\u0010\u0011\u001a\b\u0012\u0004\u0012\u00020\n0\u00122\u0006\u0010\u0013\u001a\u00020\bH\u0002J\u0016\u0010\u0014\u001a\b\u0012\u0004\u0012\u00020\n0\u00122\u0006\u0010\u0015\u001a\u00020\u0016H\u0002JT\u0010\u0017\u001a\b\u0012\u0004\u0012\u00020\u00190\u00182\u0006\u0010\t\u001a\u00020\n2\u0006\u0010\u000b\u001a\u00020\n2\b\b\u0002\u0010\f\u001a\u00020\b2\b\b\u0002\u0010\r\u001a\u00020\u000e2\b\b\u0002\u0010\u000f\u001a\u00020\u000e2\b\b\u0002\u0010\u001a\u001a\u00020\u000eH\u0086@\u00f8\u0001\u0000\u00f8\u0001\u0001\u00a2\u0006\u0004\b\u001b\u0010\u001cJ\b\u0010\u001d\u001a\u00020\bH\u0002J\u0016\u0010\u001e\u001a\u00020\b2\u0006\u0010\u001f\u001a\u00020\bH\u0082@\u00a2\u0006\u0002\u0010 J\u0018\u0010!\u001a\u00020\u00192\u0006\u0010\"\u001a\u00020\b2\u0006\u0010\u001a\u001a\u00020\u000eH\u0002J\u0016\u0010#\u001a\u00020$2\u0006\u0010\u0015\u001a\u00020\u0019H\u0082@\u00a2\u0006\u0002\u0010%J\u0010\u0010&\u001a\u00020\'2\u0006\u0010(\u001a\u00020)H\u0002R\u000e\u0010\u0002\u001a\u00020\u0003X\u0082\u0004\u00a2\u0006\u0002\n\u0000R\u000e\u0010\u0004\u001a\u00020\u0005X\u0082\u0004\u00a2\u0006\u0002\n\u0000\u0082\u0002\u000b\n\u0002\b!\n\u0005\b\u00a1\u001e0\u0001\u00a8\u0006*"}, d2 = {"Lcom/guardian/safety/data/routing/RoutingRepository;", "", "context", "Landroid/content/Context;", "firestore", "Lcom/google/firebase/firestore/FirebaseFirestore;", "(Landroid/content/Context;Lcom/google/firebase/firestore/FirebaseFirestore;)V", "buildDirectionsUrl", "", "origin", "Lcom/google/android/gms/maps/model/LatLng;", "destination", "travelMode", "avoidTolls", "", "avoidHighways", "apiKey", "decodePolyline", "", "encoded", "extractPolylinePoints", "route", "Lorg/json/JSONObject;", "getDirections", "Lkotlin/Result;", "Lcom/guardian/safety/data/model/RouteDirection;", "preferWellLit", "getDirections-bMdYcbs", "(Lcom/google/android/gms/maps/model/LatLng;Lcom/google/android/gms/maps/model/LatLng;Ljava/lang/String;ZZZLkotlin/coroutines/Continuation;)Ljava/lang/Object;", "getGoogleMapsApiKey", "makeHttpRequest", "urlString", "(Ljava/lang/String;Lkotlin/coroutines/Continuation;)Ljava/lang/Object;", "parseDirectionsResponse", "response", "saveRouteToFirebase", "", "(Lcom/guardian/safety/data/model/RouteDirection;Lkotlin/coroutines/Continuation;)Ljava/lang/Object;", "selectSafestRoute", "", "routes", "Lorg/json/JSONArray;", "app_debug"})
public final class RoutingRepository {
    @org.jetbrains.annotations.NotNull()
    private final android.content.Context context = null;
    @org.jetbrains.annotations.NotNull()
    private final com.google.firebase.firestore.FirebaseFirestore firestore = null;
    
    @javax.inject.Inject()
    public RoutingRepository(@dagger.hilt.android.qualifiers.ApplicationContext()
    @org.jetbrains.annotations.NotNull()
    android.content.Context context, @org.jetbrains.annotations.NotNull()
    com.google.firebase.firestore.FirebaseFirestore firestore) {
        super();
    }
    
    private final java.lang.String buildDirectionsUrl(com.google.android.gms.maps.model.LatLng origin, com.google.android.gms.maps.model.LatLng destination, java.lang.String travelMode, boolean avoidTolls, boolean avoidHighways, java.lang.String apiKey) {
        return null;
    }
    
    private final java.lang.Object makeHttpRequest(java.lang.String urlString, kotlin.coroutines.Continuation<? super java.lang.String> $completion) {
        return null;
    }
    
    private final com.guardian.safety.data.model.RouteDirection parseDirectionsResponse(java.lang.String response, boolean preferWellLit) {
        return null;
    }
    
    private final int selectSafestRoute(org.json.JSONArray routes) {
        return 0;
    }
    
    private final java.util.List<com.google.android.gms.maps.model.LatLng> extractPolylinePoints(org.json.JSONObject route) {
        return null;
    }
    
    private final java.util.List<com.google.android.gms.maps.model.LatLng> decodePolyline(java.lang.String encoded) {
        return null;
    }
    
    private final java.lang.Object saveRouteToFirebase(com.guardian.safety.data.model.RouteDirection route, kotlin.coroutines.Continuation<? super kotlin.Unit> $completion) {
        return null;
    }
    
    private final java.lang.String getGoogleMapsApiKey() {
        return null;
    }
}