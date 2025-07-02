package com.guardian.safety.services;

@javax.inject.Singleton()
@kotlin.Metadata(mv = {1, 9, 0}, k = 1, xi = 48, d1 = {"\u0000N\n\u0002\u0018\u0002\n\u0002\u0010\u0000\n\u0000\n\u0002\u0018\u0002\n\u0000\n\u0002\u0018\u0002\n\u0000\n\u0002\u0018\u0002\n\u0002\b\u0002\n\u0002\u0010\u0002\n\u0000\n\u0002\u0018\u0002\n\u0000\n\u0002\u0018\u0002\n\u0002\b\u0004\n\u0002\u0018\u0002\n\u0000\n\u0002\u0018\u0002\n\u0002\b\u0003\n\u0002\u0018\u0002\n\u0000\n\u0002\u0010\u000e\n\u0002\b\u0006\b\u0007\u0018\u00002\u00020\u0001B!\b\u0007\u0012\b\b\u0001\u0010\u0002\u001a\u00020\u0003\u0012\u0006\u0010\u0004\u001a\u00020\u0005\u0012\u0006\u0010\u0006\u001a\u00020\u0007\u00a2\u0006\u0002\u0010\bJ\b\u0010\t\u001a\u00020\nH\u0002J$\u0010\u000b\u001a\b\u0012\u0004\u0012\u00020\n0\f2\u0006\u0010\r\u001a\u00020\u000eH\u0086@\u00f8\u0001\u0000\u00f8\u0001\u0001\u00a2\u0006\u0004\b\u000f\u0010\u0010J(\u0010\u0011\u001a\u00020\n2\u0006\u0010\r\u001a\u00020\u000e2\b\u0010\u0012\u001a\u0004\u0018\u00010\u00132\u0006\u0010\u0014\u001a\u00020\u0015H\u0082@\u00a2\u0006\u0002\u0010\u0016J\u001e\u0010\u0017\u001a\u00020\n2\u0006\u0010\u0018\u001a\u00020\u00192\u0006\u0010\u001a\u001a\u00020\u001bH\u0082@\u00a2\u0006\u0002\u0010\u001cJ0\u0010\u001d\u001a\u00020\n2\u0006\u0010\u0018\u001a\u00020\u00192\u0006\u0010\u001a\u001a\u00020\u001b2\u0006\u0010\r\u001a\u00020\u000e2\b\u0010\u0012\u001a\u0004\u0018\u00010\u0013H\u0082@\u00a2\u0006\u0002\u0010\u001eJ8\u0010\u001f\u001a\b\u0012\u0004\u0012\u00020\n0\f2\u0006\u0010\r\u001a\u00020\u000e2\b\u0010\u0012\u001a\u0004\u0018\u00010\u00132\b\b\u0002\u0010\u0014\u001a\u00020\u0015H\u0086@\u00f8\u0001\u0000\u00f8\u0001\u0001\u00a2\u0006\u0004\b \u0010\u0016R\u000e\u0010\u0002\u001a\u00020\u0003X\u0082\u0004\u00a2\u0006\u0002\n\u0000R\u000e\u0010\u0004\u001a\u00020\u0005X\u0082\u0004\u00a2\u0006\u0002\n\u0000R\u000e\u0010\u0006\u001a\u00020\u0007X\u0082\u0004\u00a2\u0006\u0002\n\u0000\u0082\u0002\u000b\n\u0002\b!\n\u0005\b\u00a1\u001e0\u0001\u00a8\u0006!"}, d2 = {"Lcom/guardian/safety/services/SOSService;", "", "context", "Landroid/content/Context;", "firestore", "Lcom/google/firebase/firestore/FirebaseFirestore;", "functions", "Lcom/google/firebase/functions/FirebaseFunctions;", "(Landroid/content/Context;Lcom/google/firebase/firestore/FirebaseFirestore;Lcom/google/firebase/functions/FirebaseFunctions;)V", "callEmergencyServices", "", "cancelEmergency", "Lkotlin/Result;", "userProfile", "Lcom/guardian/safety/data/model/UserProfile;", "cancelEmergency-gIAlu-s", "(Lcom/guardian/safety/data/model/UserProfile;Lkotlin/coroutines/Continuation;)Ljava/lang/Object;", "notifyEmergencyContacts", "location", "Lcom/google/android/gms/maps/model/LatLng;", "emergencyType", "Lcom/guardian/safety/services/EmergencyType;", "(Lcom/guardian/safety/data/model/UserProfile;Lcom/google/android/gms/maps/model/LatLng;Lcom/guardian/safety/services/EmergencyType;Lkotlin/coroutines/Continuation;)Ljava/lang/Object;", "sendCancellationToContact", "contact", "Lcom/guardian/safety/data/model/EmergencyContact;", "message", "", "(Lcom/guardian/safety/data/model/EmergencyContact;Ljava/lang/String;Lkotlin/coroutines/Continuation;)Ljava/lang/Object;", "sendNotificationToContact", "(Lcom/guardian/safety/data/model/EmergencyContact;Ljava/lang/String;Lcom/guardian/safety/data/model/UserProfile;Lcom/google/android/gms/maps/model/LatLng;Lkotlin/coroutines/Continuation;)Ljava/lang/Object;", "triggerEmergency", "triggerEmergency-BWLJW6A", "app_debug"})
public final class SOSService {
    @org.jetbrains.annotations.NotNull()
    private final android.content.Context context = null;
    @org.jetbrains.annotations.NotNull()
    private final com.google.firebase.firestore.FirebaseFirestore firestore = null;
    @org.jetbrains.annotations.NotNull()
    private final com.google.firebase.functions.FirebaseFunctions functions = null;
    
    @javax.inject.Inject()
    public SOSService(@dagger.hilt.android.qualifiers.ApplicationContext()
    @org.jetbrains.annotations.NotNull()
    android.content.Context context, @org.jetbrains.annotations.NotNull()
    com.google.firebase.firestore.FirebaseFirestore firestore, @org.jetbrains.annotations.NotNull()
    com.google.firebase.functions.FirebaseFunctions functions) {
        super();
    }
    
    private final java.lang.Object notifyEmergencyContacts(com.guardian.safety.data.model.UserProfile userProfile, com.google.android.gms.maps.model.LatLng location, com.guardian.safety.services.EmergencyType emergencyType, kotlin.coroutines.Continuation<? super kotlin.Unit> $completion) {
        return null;
    }
    
    private final java.lang.Object sendNotificationToContact(com.guardian.safety.data.model.EmergencyContact contact, java.lang.String message, com.guardian.safety.data.model.UserProfile userProfile, com.google.android.gms.maps.model.LatLng location, kotlin.coroutines.Continuation<? super kotlin.Unit> $completion) {
        return null;
    }
    
    private final void callEmergencyServices() {
    }
    
    private final java.lang.Object sendCancellationToContact(com.guardian.safety.data.model.EmergencyContact contact, java.lang.String message, kotlin.coroutines.Continuation<? super kotlin.Unit> $completion) {
        return null;
    }
}