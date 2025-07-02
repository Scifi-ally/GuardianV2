package com.guardian.safety.data.repositories;

@javax.inject.Singleton()
@kotlin.Metadata(mv = {1, 9, 0}, k = 1, xi = 48, d1 = {"\u0000<\n\u0002\u0018\u0002\n\u0002\u0010\u0000\n\u0000\n\u0002\u0018\u0002\n\u0002\b\u0002\n\u0002\u0018\u0002\n\u0002\u0018\u0002\n\u0000\n\u0002\u0010\u000e\n\u0002\b\u0004\n\u0002\u0010\b\n\u0002\b\u0003\n\u0002\u0018\u0002\n\u0002\b\u0007\n\u0002\u0010\u0002\n\u0002\b\b\b\u0007\u0018\u00002\u00020\u0001B\u000f\b\u0007\u0012\u0006\u0010\u0002\u001a\u00020\u0003\u00a2\u0006\u0002\u0010\u0004JD\u0010\u0005\u001a\b\u0012\u0004\u0012\u00020\u00070\u00062\u0006\u0010\b\u001a\u00020\t2\u0006\u0010\n\u001a\u00020\t2\u0006\u0010\u000b\u001a\u00020\t2\u0006\u0010\f\u001a\u00020\t2\u0006\u0010\r\u001a\u00020\u000eH\u0086@\u00f8\u0001\u0000\u00f8\u0001\u0001\u00a2\u0006\u0004\b\u000f\u0010\u0010J\u0018\u0010\u0011\u001a\u0004\u0018\u00010\u00122\u0006\u0010\f\u001a\u00020\tH\u0086@\u00a2\u0006\u0002\u0010\u0013J$\u0010\u0014\u001a\b\u0012\u0004\u0012\u00020\t0\u00062\u0006\u0010\b\u001a\u00020\tH\u0086@\u00f8\u0001\u0000\u00f8\u0001\u0001\u00a2\u0006\u0004\b\u0015\u0010\u0013J\b\u0010\u0016\u001a\u00020\tH\u0002J\u000e\u0010\u0017\u001a\u00020\tH\u0082@\u00a2\u0006\u0002\u0010\u0018J,\u0010\u0019\u001a\b\u0012\u0004\u0012\u00020\u001a0\u00062\u0006\u0010\b\u001a\u00020\t2\u0006\u0010\u001b\u001a\u00020\tH\u0086@\u00f8\u0001\u0000\u00f8\u0001\u0001\u00a2\u0006\u0004\b\u001c\u0010\u001dJ,\u0010\u001e\u001a\b\u0012\u0004\u0012\u00020\u001a0\u00062\u0006\u0010\b\u001a\u00020\t2\u0006\u0010\u001f\u001a\u00020\u0007H\u0086@\u00f8\u0001\u0000\u00f8\u0001\u0001\u00a2\u0006\u0004\b \u0010!R\u000e\u0010\u0002\u001a\u00020\u0003X\u0082\u0004\u00a2\u0006\u0002\n\u0000\u0082\u0002\u000b\n\u0002\b!\n\u0005\b\u00a1\u001e0\u0001\u00a8\u0006\""}, d2 = {"Lcom/guardian/safety/data/repositories/EmergencyContactsRepository;", "", "firestore", "Lcom/google/firebase/firestore/FirebaseFirestore;", "(Lcom/google/firebase/firestore/FirebaseFirestore;)V", "addEmergencyContact", "Lkotlin/Result;", "Lcom/guardian/safety/data/models/EmergencyContact;", "userId", "", "name", "relationship", "guardianKey", "priority", "", "addEmergencyContact-hUnOzRk", "(Ljava/lang/String;Ljava/lang/String;Ljava/lang/String;Ljava/lang/String;ILkotlin/coroutines/Continuation;)Ljava/lang/Object;", "findUserByGuardianKey", "Lcom/guardian/safety/data/models/User;", "(Ljava/lang/String;Lkotlin/coroutines/Continuation;)Ljava/lang/Object;", "generateGuardianKey", "generateGuardianKey-gIAlu-s", "generateRandomKey", "generateUniqueKey", "(Lkotlin/coroutines/Continuation;)Ljava/lang/Object;", "removeEmergencyContact", "", "contactId", "removeEmergencyContact-0E7RQCE", "(Ljava/lang/String;Ljava/lang/String;Lkotlin/coroutines/Continuation;)Ljava/lang/Object;", "updateEmergencyContact", "contact", "updateEmergencyContact-0E7RQCE", "(Ljava/lang/String;Lcom/guardian/safety/data/models/EmergencyContact;Lkotlin/coroutines/Continuation;)Ljava/lang/Object;", "app_debug"})
public final class EmergencyContactsRepository {
    @org.jetbrains.annotations.NotNull()
    private final com.google.firebase.firestore.FirebaseFirestore firestore = null;
    
    @javax.inject.Inject()
    public EmergencyContactsRepository(@org.jetbrains.annotations.NotNull()
    com.google.firebase.firestore.FirebaseFirestore firestore) {
        super();
    }
    
    @org.jetbrains.annotations.Nullable()
    public final java.lang.Object findUserByGuardianKey(@org.jetbrains.annotations.NotNull()
    java.lang.String guardianKey, @org.jetbrains.annotations.NotNull()
    kotlin.coroutines.Continuation<? super com.guardian.safety.data.models.User> $completion) {
        return null;
    }
    
    private final java.lang.Object generateUniqueKey(kotlin.coroutines.Continuation<? super java.lang.String> $completion) {
        return null;
    }
    
    private final java.lang.String generateRandomKey() {
        return null;
    }
}