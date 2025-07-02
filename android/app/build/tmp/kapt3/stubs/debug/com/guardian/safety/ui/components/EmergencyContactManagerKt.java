package com.guardian.safety.ui.components;

@kotlin.Metadata(mv = {1, 9, 0}, k = 2, xi = 48, d1 = {"\u00002\n\u0000\n\u0002\u0010\u0002\n\u0000\n\u0002\u0018\u0002\n\u0000\n\u0002\u0018\u0002\n\u0000\n\u0002\u0018\u0002\n\u0002\b\u0005\n\u0002\u0010 \n\u0002\b\u0002\n\u0002\u0010\u000e\n\u0002\b\u0002\n\u0002\u0018\u0002\n\u0000\u001a2\u0010\u0000\u001a\u00020\u00012\u0006\u0010\u0002\u001a\u00020\u00032\u0012\u0010\u0004\u001a\u000e\u0012\u0004\u0012\u00020\u0003\u0012\u0004\u0012\u00020\u00010\u00052\f\u0010\u0006\u001a\b\u0012\u0004\u0012\u00020\u00010\u0007H\u0003\u001a4\u0010\b\u001a\u00020\u00012\b\u0010\u0002\u001a\u0004\u0018\u00010\u00032\f\u0010\t\u001a\b\u0012\u0004\u0012\u00020\u00010\u00072\u0012\u0010\n\u001a\u000e\u0012\u0004\u0012\u00020\u0003\u0012\u0004\u0012\u00020\u00010\u0005H\u0003\u001a\\\u0010\u000b\u001a\u00020\u00012\f\u0010\f\u001a\b\u0012\u0004\u0012\u00020\u00030\r2\u0012\u0010\u000e\u001a\u000e\u0012\u0004\u0012\u00020\u0003\u0012\u0004\u0012\u00020\u00010\u00052\u0012\u0010\u000f\u001a\u000e\u0012\u0004\u0012\u00020\u0010\u0012\u0004\u0012\u00020\u00010\u00052\u0012\u0010\u0011\u001a\u000e\u0012\u0004\u0012\u00020\u0003\u0012\u0004\u0012\u00020\u00010\u00052\b\b\u0002\u0010\u0012\u001a\u00020\u0013H\u0007\u00a8\u0006\u0014"}, d2 = {"EmergencyContactCard", "", "contact", "Lcom/guardian/safety/ui/components/EmergencyContact;", "onEdit", "Lkotlin/Function1;", "onRemove", "Lkotlin/Function0;", "EmergencyContactDialog", "onDismiss", "onSave", "EmergencyContactManager", "contacts", "", "onAddContact", "onRemoveContact", "", "onUpdateContact", "modifier", "Landroidx/compose/ui/Modifier;", "app_debug"})
public final class EmergencyContactManagerKt {
    
    @androidx.compose.runtime.Composable()
    public static final void EmergencyContactManager(@org.jetbrains.annotations.NotNull()
    java.util.List<com.guardian.safety.ui.components.EmergencyContact> contacts, @org.jetbrains.annotations.NotNull()
    kotlin.jvm.functions.Function1<? super com.guardian.safety.ui.components.EmergencyContact, kotlin.Unit> onAddContact, @org.jetbrains.annotations.NotNull()
    kotlin.jvm.functions.Function1<? super java.lang.String, kotlin.Unit> onRemoveContact, @org.jetbrains.annotations.NotNull()
    kotlin.jvm.functions.Function1<? super com.guardian.safety.ui.components.EmergencyContact, kotlin.Unit> onUpdateContact, @org.jetbrains.annotations.NotNull()
    androidx.compose.ui.Modifier modifier) {
    }
    
    @androidx.compose.runtime.Composable()
    private static final void EmergencyContactCard(com.guardian.safety.ui.components.EmergencyContact contact, kotlin.jvm.functions.Function1<? super com.guardian.safety.ui.components.EmergencyContact, kotlin.Unit> onEdit, kotlin.jvm.functions.Function0<kotlin.Unit> onRemove) {
    }
    
    @androidx.compose.runtime.Composable()
    private static final void EmergencyContactDialog(com.guardian.safety.ui.components.EmergencyContact contact, kotlin.jvm.functions.Function0<kotlin.Unit> onDismiss, kotlin.jvm.functions.Function1<? super com.guardian.safety.ui.components.EmergencyContact, kotlin.Unit> onSave) {
    }
}