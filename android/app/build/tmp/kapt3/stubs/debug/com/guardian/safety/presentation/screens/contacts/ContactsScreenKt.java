package com.guardian.safety.presentation.screens.contacts;

@kotlin.Metadata(mv = {1, 9, 0}, k = 2, xi = 48, d1 = {"\u00008\n\u0000\n\u0002\u0010\u0002\n\u0000\n\u0002\u0018\u0002\n\u0000\n\u0002\u0018\u0002\n\u0002\u0010\u000e\n\u0002\u0010\b\n\u0002\b\u0002\n\u0002\u0018\u0002\n\u0002\b\u0004\n\u0002\u0018\u0002\n\u0000\n\u0002\u0018\u0002\n\u0000\n\u0002\u0018\u0002\n\u0000\u001a<\u0010\u0000\u001a\u00020\u00012\f\u0010\u0002\u001a\b\u0012\u0004\u0012\u00020\u00010\u00032$\u0010\u0004\u001a \u0012\u0004\u0012\u00020\u0006\u0012\u0004\u0012\u00020\u0006\u0012\u0004\u0012\u00020\u0006\u0012\u0004\u0012\u00020\u0007\u0012\u0004\u0012\u00020\u00010\u0005H\u0007\u001a,\u0010\b\u001a\u00020\u00012\u0006\u0010\t\u001a\u00020\n2\f\u0010\u000b\u001a\b\u0012\u0004\u0012\u00020\u00010\u00032\f\u0010\f\u001a\b\u0012\u0004\u0012\u00020\u00010\u0003H\u0007\u001a$\u0010\r\u001a\u00020\u00012\u0006\u0010\u000e\u001a\u00020\u000f2\b\b\u0002\u0010\u0010\u001a\u00020\u00112\b\b\u0002\u0010\u0012\u001a\u00020\u0013H\u0007\u00a8\u0006\u0014"}, d2 = {"AddContactDialog", "", "onDismiss", "Lkotlin/Function0;", "onAddContact", "Lkotlin/Function4;", "", "", "ContactCard", "contact", "Lcom/guardian/safety/data/models/EmergencyContact;", "onEdit", "onDelete", "ContactsScreen", "navController", "Landroidx/navigation/NavController;", "authViewModel", "Lcom/guardian/safety/presentation/viewmodels/AuthViewModel;", "contactsViewModel", "Lcom/guardian/safety/presentation/viewmodels/ContactsViewModel;", "app_debug"})
public final class ContactsScreenKt {
    
    @kotlin.OptIn(markerClass = {androidx.compose.material3.ExperimentalMaterial3Api.class})
    @androidx.compose.runtime.Composable()
    public static final void ContactsScreen(@org.jetbrains.annotations.NotNull()
    androidx.navigation.NavController navController, @org.jetbrains.annotations.NotNull()
    com.guardian.safety.presentation.viewmodels.AuthViewModel authViewModel, @org.jetbrains.annotations.NotNull()
    com.guardian.safety.presentation.viewmodels.ContactsViewModel contactsViewModel) {
    }
    
    @androidx.compose.runtime.Composable()
    public static final void ContactCard(@org.jetbrains.annotations.NotNull()
    com.guardian.safety.data.models.EmergencyContact contact, @org.jetbrains.annotations.NotNull()
    kotlin.jvm.functions.Function0<kotlin.Unit> onEdit, @org.jetbrains.annotations.NotNull()
    kotlin.jvm.functions.Function0<kotlin.Unit> onDelete) {
    }
    
    @androidx.compose.runtime.Composable()
    public static final void AddContactDialog(@org.jetbrains.annotations.NotNull()
    kotlin.jvm.functions.Function0<kotlin.Unit> onDismiss, @org.jetbrains.annotations.NotNull()
    kotlin.jvm.functions.Function4<? super java.lang.String, ? super java.lang.String, ? super java.lang.String, ? super java.lang.Integer, kotlin.Unit> onAddContact) {
    }
}