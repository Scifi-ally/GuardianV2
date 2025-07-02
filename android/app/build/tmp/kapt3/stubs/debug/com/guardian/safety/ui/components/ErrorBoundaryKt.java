package com.guardian.safety.ui.components;

@kotlin.Metadata(mv = {1, 9, 0}, k = 2, xi = 48, d1 = {"\u00000\n\u0000\n\u0002\u0010\u0002\n\u0000\n\u0002\u0010\u0003\n\u0000\n\u0002\u0018\u0002\n\u0002\b\u0002\n\u0002\u0018\u0002\n\u0000\n\u0002\u0018\u0002\n\u0002\b\u0003\n\u0002\u0018\u0002\n\u0000\n\u0002\u0018\u0002\n\u0000\u001aU\u0010\u0000\u001a\u00020\u00012\n\b\u0002\u0010\u0002\u001a\u0004\u0018\u00010\u00032\u0010\b\u0002\u0010\u0004\u001a\n\u0012\u0004\u0012\u00020\u0001\u0018\u00010\u00052\u0010\b\u0002\u0010\u0006\u001a\n\u0012\u0004\u0012\u00020\u0001\u0018\u00010\u00052\b\b\u0002\u0010\u0007\u001a\u00020\b2\u0011\u0010\t\u001a\r\u0012\u0004\u0012\u00020\u00010\u0005\u00a2\u0006\u0002\b\nH\u0007\u001a>\u0010\u000b\u001a\u00020\u00012\u0006\u0010\u0002\u001a\u00020\u00032\u0010\b\u0002\u0010\u0004\u001a\n\u0012\u0004\u0012\u00020\u0001\u0018\u00010\u00052\u0010\b\u0002\u0010\u0006\u001a\n\u0012\u0004\u0012\u00020\u0001\u0018\u00010\u00052\b\b\u0002\u0010\u0007\u001a\u00020\bH\u0007\u001aC\u0010\f\u001a\u00020\u00012\n\b\u0002\u0010\u0002\u001a\u0004\u0018\u00010\u00032\u0010\b\u0002\u0010\u0004\u001a\n\u0012\u0004\u0012\u00020\u0001\u0018\u00010\u00052\b\b\u0002\u0010\u0007\u001a\u00020\b2\u0011\u0010\t\u001a\r\u0012\u0004\u0012\u00020\u00010\u0005\u00a2\u0006\u0002\b\nH\u0007\u001a\u0014\u0010\r\u001a\u000e\u0012\u0004\u0012\u00020\u0003\u0012\u0004\u0012\u00020\u00010\u000eH\u0007\u001a\b\u0010\u000f\u001a\u00020\u0010H\u0007\u00a8\u0006\u0011"}, d2 = {"ErrorBoundary", "", "error", "", "onRetry", "Lkotlin/Function0;", "onReset", "modifier", "Landroidx/compose/ui/Modifier;", "content", "Landroidx/compose/runtime/Composable;", "ErrorFallback", "ProfileErrorBoundary", "rememberErrorHandler", "Lkotlin/Function1;", "rememberErrorState", "Lcom/guardian/safety/ui/components/ErrorState;", "app_debug"})
public final class ErrorBoundaryKt {
    
    @androidx.compose.runtime.Composable()
    public static final void ErrorBoundary(@org.jetbrains.annotations.Nullable()
    java.lang.Throwable error, @org.jetbrains.annotations.Nullable()
    kotlin.jvm.functions.Function0<kotlin.Unit> onRetry, @org.jetbrains.annotations.Nullable()
    kotlin.jvm.functions.Function0<kotlin.Unit> onReset, @org.jetbrains.annotations.NotNull()
    androidx.compose.ui.Modifier modifier, @org.jetbrains.annotations.NotNull()
    kotlin.jvm.functions.Function0<kotlin.Unit> content) {
    }
    
    @androidx.compose.runtime.Composable()
    public static final void ErrorFallback(@org.jetbrains.annotations.NotNull()
    java.lang.Throwable error, @org.jetbrains.annotations.Nullable()
    kotlin.jvm.functions.Function0<kotlin.Unit> onRetry, @org.jetbrains.annotations.Nullable()
    kotlin.jvm.functions.Function0<kotlin.Unit> onReset, @org.jetbrains.annotations.NotNull()
    androidx.compose.ui.Modifier modifier) {
    }
    
    @androidx.compose.runtime.Composable()
    public static final void ProfileErrorBoundary(@org.jetbrains.annotations.Nullable()
    java.lang.Throwable error, @org.jetbrains.annotations.Nullable()
    kotlin.jvm.functions.Function0<kotlin.Unit> onRetry, @org.jetbrains.annotations.NotNull()
    androidx.compose.ui.Modifier modifier, @org.jetbrains.annotations.NotNull()
    kotlin.jvm.functions.Function0<kotlin.Unit> content) {
    }
    
    @androidx.compose.runtime.Composable()
    @org.jetbrains.annotations.NotNull()
    public static final kotlin.jvm.functions.Function1<java.lang.Throwable, kotlin.Unit> rememberErrorHandler() {
        return null;
    }
    
    @androidx.compose.runtime.Composable()
    @org.jetbrains.annotations.NotNull()
    public static final com.guardian.safety.ui.components.ErrorState rememberErrorState() {
        return null;
    }
}