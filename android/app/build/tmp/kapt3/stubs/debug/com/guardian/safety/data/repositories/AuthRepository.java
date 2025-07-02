package com.guardian.safety.data.repositories;

@javax.inject.Singleton()
@kotlin.Metadata(mv = {1, 9, 0}, k = 1, xi = 48, d1 = {"\u0000F\n\u0002\u0018\u0002\n\u0002\u0010\u0000\n\u0000\n\u0002\u0018\u0002\n\u0000\n\u0002\u0018\u0002\n\u0002\b\u0002\n\u0002\u0018\u0002\n\u0002\u0018\u0002\n\u0002\b\u0003\n\u0002\u0018\u0002\n\u0002\u0010\u0002\n\u0000\n\u0002\u0018\u0002\n\u0002\b\u0004\n\u0002\u0010\u000e\n\u0002\b\u0007\n\u0002\u0010\u000b\n\u0002\b\u0006\b\u0007\u0018\u00002\u00020\u0001B\u0017\b\u0007\u0012\u0006\u0010\u0002\u001a\u00020\u0003\u0012\u0006\u0010\u0004\u001a\u00020\u0005\u00a2\u0006\u0002\u0010\u0006J$\u0010\f\u001a\b\u0012\u0004\u0012\u00020\u000e0\r2\u0006\u0010\u000f\u001a\u00020\u0010H\u0086@\u00f8\u0001\u0000\u00f8\u0001\u0001\u00a2\u0006\u0004\b\u0011\u0010\u0012J,\u0010\u0013\u001a\b\u0012\u0004\u0012\u00020\t0\r2\u0006\u0010\u0014\u001a\u00020\u00152\u0006\u0010\u0016\u001a\u00020\u0015H\u0086@\u00f8\u0001\u0000\u00f8\u0001\u0001\u00a2\u0006\u0004\b\u0017\u0010\u0018J\u001e\u0010\u0019\u001a\n\u0012\u0006\u0012\u0004\u0018\u00010\u00100\rH\u0086@\u00f8\u0001\u0000\u00f8\u0001\u0001\u00a2\u0006\u0004\b\u001a\u0010\u001bJ\u0006\u0010\u001c\u001a\u00020\u001dJ,\u0010\u001e\u001a\b\u0012\u0004\u0012\u00020\t0\r2\u0006\u0010\u0014\u001a\u00020\u00152\u0006\u0010\u0016\u001a\u00020\u0015H\u0086@\u00f8\u0001\u0000\u00f8\u0001\u0001\u00a2\u0006\u0004\b\u001f\u0010\u0018J\u000e\u0010 \u001a\u00020\u000eH\u0086@\u00a2\u0006\u0002\u0010\u001bJ$\u0010!\u001a\b\u0012\u0004\u0012\u00020\u000e0\r2\u0006\u0010\u000f\u001a\u00020\u0010H\u0086@\u00f8\u0001\u0000\u00f8\u0001\u0001\u00a2\u0006\u0004\b\"\u0010\u0012R\u0019\u0010\u0007\u001a\n\u0012\u0006\u0012\u0004\u0018\u00010\t0\b\u00a2\u0006\b\n\u0000\u001a\u0004\b\n\u0010\u000bR\u000e\u0010\u0002\u001a\u00020\u0003X\u0082\u0004\u00a2\u0006\u0002\n\u0000R\u000e\u0010\u0004\u001a\u00020\u0005X\u0082\u0004\u00a2\u0006\u0002\n\u0000\u0082\u0002\u000b\n\u0002\b!\n\u0005\b\u00a1\u001e0\u0001\u00a8\u0006#"}, d2 = {"Lcom/guardian/safety/data/repositories/AuthRepository;", "", "firebaseAuth", "Lcom/google/firebase/auth/FirebaseAuth;", "firestore", "Lcom/google/firebase/firestore/FirebaseFirestore;", "(Lcom/google/firebase/auth/FirebaseAuth;Lcom/google/firebase/firestore/FirebaseFirestore;)V", "currentUser", "Lkotlinx/coroutines/flow/Flow;", "Lcom/google/firebase/auth/FirebaseUser;", "getCurrentUser", "()Lkotlinx/coroutines/flow/Flow;", "createUserProfile", "Lkotlin/Result;", "", "user", "Lcom/guardian/safety/data/models/User;", "createUserProfile-gIAlu-s", "(Lcom/guardian/safety/data/models/User;Lkotlin/coroutines/Continuation;)Ljava/lang/Object;", "createUserWithEmailAndPassword", "email", "", "password", "createUserWithEmailAndPassword-0E7RQCE", "(Ljava/lang/String;Ljava/lang/String;Lkotlin/coroutines/Continuation;)Ljava/lang/Object;", "getCurrentUserProfile", "getCurrentUserProfile-IoAF18A", "(Lkotlin/coroutines/Continuation;)Ljava/lang/Object;", "isUserAuthenticated", "", "signInWithEmailAndPassword", "signInWithEmailAndPassword-0E7RQCE", "signOut", "updateUserProfile", "updateUserProfile-gIAlu-s", "app_debug"})
public final class AuthRepository {
    @org.jetbrains.annotations.NotNull()
    private final com.google.firebase.auth.FirebaseAuth firebaseAuth = null;
    @org.jetbrains.annotations.NotNull()
    private final com.google.firebase.firestore.FirebaseFirestore firestore = null;
    @org.jetbrains.annotations.NotNull()
    private final kotlinx.coroutines.flow.Flow<com.google.firebase.auth.FirebaseUser> currentUser = null;
    
    @javax.inject.Inject()
    public AuthRepository(@org.jetbrains.annotations.NotNull()
    com.google.firebase.auth.FirebaseAuth firebaseAuth, @org.jetbrains.annotations.NotNull()
    com.google.firebase.firestore.FirebaseFirestore firestore) {
        super();
    }
    
    @org.jetbrains.annotations.NotNull()
    public final kotlinx.coroutines.flow.Flow<com.google.firebase.auth.FirebaseUser> getCurrentUser() {
        return null;
    }
    
    @org.jetbrains.annotations.Nullable()
    public final java.lang.Object signOut(@org.jetbrains.annotations.NotNull()
    kotlin.coroutines.Continuation<? super kotlin.Unit> $completion) {
        return null;
    }
    
    public final boolean isUserAuthenticated() {
        return false;
    }
}