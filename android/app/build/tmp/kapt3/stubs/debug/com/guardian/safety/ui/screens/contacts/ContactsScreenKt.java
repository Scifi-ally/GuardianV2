package com.guardian.safety.ui.screens.contacts;

@kotlin.Metadata(mv = {1, 9, 0}, k = 2, xi = 48, d1 = {"\u00000\n\u0000\n\u0002\u0010\u0002\n\u0000\n\u0002\u0018\u0002\n\u0000\n\u0002\u0018\u0002\n\u0002\u0010\u000e\n\u0002\b\u0002\n\u0002\u0018\u0002\n\u0000\n\u0002\u0018\u0002\n\u0002\b\u0002\n\u0002\u0018\u0002\n\u0002\b\u0002\u001a*\u0010\u0000\u001a\u00020\u00012\f\u0010\u0002\u001a\b\u0012\u0004\u0012\u00020\u00010\u00032\u0012\u0010\u0004\u001a\u000e\u0012\u0004\u0012\u00020\u0006\u0012\u0004\u0012\u00020\u00010\u0005H\u0003\u001a\u001a\u0010\u0007\u001a\u00020\u00012\u0006\u0010\b\u001a\u00020\t2\b\b\u0002\u0010\n\u001a\u00020\u000bH\u0007\u001a\u001e\u0010\f\u001a\u00020\u00012\u0006\u0010\r\u001a\u00020\u000e2\f\u0010\u000f\u001a\b\u0012\u0004\u0012\u00020\u00010\u0003H\u0003\u00a8\u0006\u0010"}, d2 = {"AddContactDialog", "", "onDismiss", "Lkotlin/Function0;", "onAdd", "Lkotlin/Function1;", "", "ContactsScreen", "navController", "Landroidx/navigation/NavHostController;", "viewModel", "Lcom/guardian/safety/ui/viewmodel/ContactsViewModel;", "EmergencyContactCard", "contact", "Lcom/guardian/safety/data/model/EmergencyContact;", "onRemove", "app_debug"})
public final class ContactsScreenKt {
    
    @kotlin.OptIn(markerClass = {androidx.compose.material3.ExperimentalMaterial3Api.class})
    @androidx.compose.runtime.Composable()
    public static final void ContactsScreen(@org.jetbrains.annotations.NotNull()
    androidx.navigation.NavHostController navController, @org.jetbrains.annotations.NotNull()
    com.guardian.safety.ui.viewmodel.ContactsViewModel viewModel) {
    }
    
    @androidx.compose.runtime.Composable()
    private static final void EmergencyContactCard(com.guardian.safety.data.model.EmergencyContact contact, kotlin.jvm.functions.Function0<kotlin.Unit> onRemove) {
    }
    
    @androidx.compose.runtime.Composable()
    private static final void AddContactDialog(kotlin.jvm.functions.Function0<kotlin.Unit> onDismiss, kotlin.jvm.functions.Function1<? super java.lang.String, kotlin.Unit> onAdd) {
    }
}