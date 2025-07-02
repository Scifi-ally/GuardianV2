package com.guardian.safety.data.contacts;

@javax.inject.Singleton()
@kotlin.Metadata(mv = {1, 9, 0}, k = 1, xi = 48, d1 = {"\u00006\n\u0002\u0018\u0002\n\u0002\u0010\u0000\n\u0000\n\u0002\u0018\u0002\n\u0002\b\u0002\n\u0002\u0018\u0002\n\u0002\u0010\u0002\n\u0000\n\u0002\u0010\u000e\n\u0000\n\u0002\u0018\u0002\n\u0002\b\u0006\n\u0002\u0018\u0002\n\u0002\u0010 \n\u0002\b\u0005\b\u0007\u0018\u00002\u00020\u0001B\u000f\b\u0007\u0012\u0006\u0010\u0002\u001a\u00020\u0003\u00a2\u0006\u0002\u0010\u0004J,\u0010\u0005\u001a\b\u0012\u0004\u0012\u00020\u00070\u00062\u0006\u0010\b\u001a\u00020\t2\u0006\u0010\n\u001a\u00020\u000bH\u0086@\u00f8\u0001\u0000\u00f8\u0001\u0001\u00a2\u0006\u0004\b\f\u0010\rJ\u0018\u0010\u000e\u001a\u0004\u0018\u00010\u000b2\u0006\u0010\u000f\u001a\u00020\tH\u0086@\u00a2\u0006\u0002\u0010\u0010J\u001a\u0010\u0011\u001a\u000e\u0012\n\u0012\b\u0012\u0004\u0012\u00020\u000b0\u00130\u00122\u0006\u0010\b\u001a\u00020\tJ,\u0010\u0014\u001a\b\u0012\u0004\u0012\u00020\u00070\u00062\u0006\u0010\b\u001a\u00020\t2\u0006\u0010\u0015\u001a\u00020\tH\u0086@\u00f8\u0001\u0000\u00f8\u0001\u0001\u00a2\u0006\u0004\b\u0016\u0010\u0017R\u000e\u0010\u0002\u001a\u00020\u0003X\u0082\u0004\u00a2\u0006\u0002\n\u0000\u0082\u0002\u000b\n\u0002\b!\n\u0005\b\u00a1\u001e0\u0001\u00a8\u0006\u0018"}, d2 = {"Lcom/guardian/safety/data/contacts/EmergencyContactRepository;", "", "firestore", "Lcom/google/firebase/firestore/FirebaseFirestore;", "(Lcom/google/firebase/firestore/FirebaseFirestore;)V", "addEmergencyContact", "Lkotlin/Result;", "", "userId", "", "contact", "Lcom/guardian/safety/data/model/EmergencyContact;", "addEmergencyContact-0E7RQCE", "(Ljava/lang/String;Lcom/guardian/safety/data/model/EmergencyContact;Lkotlin/coroutines/Continuation;)Ljava/lang/Object;", "findContactByGuardianKey", "guardianKey", "(Ljava/lang/String;Lkotlin/coroutines/Continuation;)Ljava/lang/Object;", "getEmergencyContacts", "Lkotlinx/coroutines/flow/Flow;", "", "removeEmergencyContact", "contactId", "removeEmergencyContact-0E7RQCE", "(Ljava/lang/String;Ljava/lang/String;Lkotlin/coroutines/Continuation;)Ljava/lang/Object;", "app_debug"})
public final class EmergencyContactRepository {
    @org.jetbrains.annotations.NotNull()
    private final com.google.firebase.firestore.FirebaseFirestore firestore = null;
    
    @javax.inject.Inject()
    public EmergencyContactRepository(@org.jetbrains.annotations.NotNull()
    com.google.firebase.firestore.FirebaseFirestore firestore) {
        super();
    }
    
    @org.jetbrains.annotations.NotNull()
    public final kotlinx.coroutines.flow.Flow<java.util.List<com.guardian.safety.data.model.EmergencyContact>> getEmergencyContacts(@org.jetbrains.annotations.NotNull()
    java.lang.String userId) {
        return null;
    }
    
    @org.jetbrains.annotations.Nullable()
    public final java.lang.Object findContactByGuardianKey(@org.jetbrains.annotations.NotNull()
    java.lang.String guardianKey, @org.jetbrains.annotations.NotNull()
    kotlin.coroutines.Continuation<? super com.guardian.safety.data.model.EmergencyContact> $completion) {
        return null;
    }
}