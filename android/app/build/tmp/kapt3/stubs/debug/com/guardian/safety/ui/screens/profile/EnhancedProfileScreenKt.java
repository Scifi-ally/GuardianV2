package com.guardian.safety.ui.screens.profile;

@kotlin.Metadata(mv = {1, 9, 0}, k = 2, xi = 48, d1 = {"\u0000H\n\u0000\n\u0002\u0010\u0002\n\u0000\n\u0002\u0018\u0002\n\u0000\n\u0002\u0018\u0002\n\u0000\n\u0002\u0018\u0002\n\u0002\u0010\u000e\n\u0002\u0018\u0002\n\u0002\b\u0004\n\u0002\u0018\u0002\n\u0000\n\u0002\u0018\u0002\n\u0002\b\u0002\n\u0002\u0018\u0002\n\u0002\b\u0004\n\u0002\u0010\u000b\n\u0002\b\u0003\n\u0002\u0018\u0002\n\u0000\u001aX\u0010\u0000\u001a\u00020\u00012\b\u0010\u0002\u001a\u0004\u0018\u00010\u00032\f\u0010\u0004\u001a\b\u0012\u0004\u0012\u00020\u00010\u000526\u0010\u0006\u001a2\u0012\u0013\u0012\u00110\b\u00a2\u0006\f\b\t\u0012\b\b\n\u0012\u0004\b\b(\n\u0012\u0013\u0012\u00110\b\u00a2\u0006\f\b\t\u0012\b\b\n\u0012\u0004\b\b(\u000b\u0012\u0004\u0012\u00020\u00010\u0007H\u0003\u001a\u001a\u0010\f\u001a\u00020\u00012\u0006\u0010\r\u001a\u00020\u000e2\b\b\u0002\u0010\u000f\u001a\u00020\u0010H\u0007\u001a8\u0010\u0011\u001a\u00020\u00012\u0006\u0010\u0012\u001a\u00020\u00132\u0006\u0010\u0014\u001a\u00020\b2\u0006\u0010\u0015\u001a\u00020\b2\f\u0010\u0016\u001a\b\u0012\u0004\u0012\u00020\u00010\u00052\b\b\u0002\u0010\u0017\u001a\u00020\u0018H\u0003\u001a*\u0010\u0019\u001a\u00020\u00012\u0006\u0010\u0014\u001a\u00020\b2\u0006\u0010\u001a\u001a\u00020\b2\u0006\u0010\u0012\u001a\u00020\u00132\b\b\u0002\u0010\u001b\u001a\u00020\u001cH\u0003\u00a8\u0006\u001d"}, d2 = {"EditProfileDialog", "", "userProfile", "Lcom/guardian/safety/data/model/UserProfile;", "onDismiss", "Lkotlin/Function0;", "onSave", "Lkotlin/Function2;", "", "Lkotlin/ParameterName;", "name", "email", "EnhancedProfileScreen", "navController", "Landroidx/navigation/NavHostController;", "authViewModel", "Lcom/guardian/safety/ui/viewmodel/AuthViewModel;", "SettingsItem", "icon", "Landroidx/compose/ui/graphics/vector/ImageVector;", "title", "subtitle", "onClick", "isDestructive", "", "StatCard", "value", "modifier", "Landroidx/compose/ui/Modifier;", "app_debug"})
public final class EnhancedProfileScreenKt {
    
    @kotlin.OptIn(markerClass = {androidx.compose.material3.ExperimentalMaterial3Api.class})
    @androidx.compose.runtime.Composable()
    public static final void EnhancedProfileScreen(@org.jetbrains.annotations.NotNull()
    androidx.navigation.NavHostController navController, @org.jetbrains.annotations.NotNull()
    com.guardian.safety.ui.viewmodel.AuthViewModel authViewModel) {
    }
    
    @androidx.compose.runtime.Composable()
    private static final void StatCard(java.lang.String title, java.lang.String value, androidx.compose.ui.graphics.vector.ImageVector icon, androidx.compose.ui.Modifier modifier) {
    }
    
    @androidx.compose.runtime.Composable()
    private static final void SettingsItem(androidx.compose.ui.graphics.vector.ImageVector icon, java.lang.String title, java.lang.String subtitle, kotlin.jvm.functions.Function0<kotlin.Unit> onClick, boolean isDestructive) {
    }
    
    @androidx.compose.runtime.Composable()
    private static final void EditProfileDialog(com.guardian.safety.data.model.UserProfile userProfile, kotlin.jvm.functions.Function0<kotlin.Unit> onDismiss, kotlin.jvm.functions.Function2<? super java.lang.String, ? super java.lang.String, kotlin.Unit> onSave) {
    }
}