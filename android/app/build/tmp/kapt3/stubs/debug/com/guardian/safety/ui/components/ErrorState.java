package com.guardian.safety.ui.components;

@kotlin.Metadata(mv = {1, 9, 0}, k = 1, xi = 48, d1 = {"\u0000 \n\u0002\u0018\u0002\n\u0002\u0010\u0000\n\u0000\n\u0002\u0010\u0003\n\u0000\n\u0002\u0010\u000b\n\u0002\b\f\n\u0002\u0010\u0002\n\u0002\b\u0003\u0018\u00002\u00020\u0001B%\u0012\n\b\u0002\u0010\u0002\u001a\u0004\u0018\u00010\u0003\u0012\b\b\u0002\u0010\u0004\u001a\u00020\u0005\u0012\b\b\u0002\u0010\u0006\u001a\u00020\u0005\u00a2\u0006\u0002\u0010\u0007J\u0006\u0010\u0011\u001a\u00020\u0012J\u000e\u0010\n\u001a\u00020\u00122\u0006\u0010\u0013\u001a\u00020\u0003J\u0006\u0010\u0010\u001a\u00020\u0012J\u0006\u0010\u0014\u001a\u00020\u0012R\u001c\u0010\u0002\u001a\u0004\u0018\u00010\u0003X\u0086\u000e\u00a2\u0006\u000e\n\u0000\u001a\u0004\b\b\u0010\t\"\u0004\b\n\u0010\u000bR\u001a\u0010\u0006\u001a\u00020\u0005X\u0086\u000e\u00a2\u0006\u000e\n\u0000\u001a\u0004\b\f\u0010\r\"\u0004\b\u000e\u0010\u000fR\u001a\u0010\u0004\u001a\u00020\u0005X\u0086\u000e\u00a2\u0006\u000e\n\u0000\u001a\u0004\b\u0004\u0010\r\"\u0004\b\u0010\u0010\u000f\u00a8\u0006\u0015"}, d2 = {"Lcom/guardian/safety/ui/components/ErrorState;", "", "error", "", "isLoading", "", "hasError", "(Ljava/lang/Throwable;ZZ)V", "getError", "()Ljava/lang/Throwable;", "setError", "(Ljava/lang/Throwable;)V", "getHasError", "()Z", "setHasError", "(Z)V", "setLoading", "clear", "", "throwable", "setSuccess", "app_debug"})
public final class ErrorState {
    @org.jetbrains.annotations.Nullable()
    private java.lang.Throwable error;
    private boolean isLoading;
    private boolean hasError;
    
    public ErrorState(@org.jetbrains.annotations.Nullable()
    java.lang.Throwable error, boolean isLoading, boolean hasError) {
        super();
    }
    
    @org.jetbrains.annotations.Nullable()
    public final java.lang.Throwable getError() {
        return null;
    }
    
    public final void setError(@org.jetbrains.annotations.Nullable()
    java.lang.Throwable p0) {
    }
    
    public final boolean isLoading() {
        return false;
    }
    
    public final void setLoading(boolean p0) {
    }
    
    public final boolean getHasError() {
        return false;
    }
    
    public final void setHasError(boolean p0) {
    }
    
    public final void setError(@org.jetbrains.annotations.NotNull()
    java.lang.Throwable throwable) {
    }
    
    public final void setLoading() {
    }
    
    public final void setSuccess() {
    }
    
    public final void clear() {
    }
    
    public ErrorState() {
        super();
    }
}