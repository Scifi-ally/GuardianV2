package com.guardian.safety.ui.viewmodel;

@kotlin.Metadata(mv = {1, 9, 0}, k = 1, xi = 48, d1 = {"\u0000n\n\u0002\u0018\u0002\n\u0002\u0018\u0002\n\u0000\n\u0002\u0018\u0002\n\u0000\n\u0002\u0018\u0002\n\u0000\n\u0002\u0018\u0002\n\u0000\n\u0002\u0018\u0002\n\u0000\n\u0002\u0018\u0002\n\u0000\n\u0002\u0018\u0002\n\u0002\b\u0002\n\u0002\u0018\u0002\n\u0002\u0010 \n\u0002\u0018\u0002\n\u0000\n\u0002\u0018\u0002\n\u0000\n\u0002\u0018\u0002\n\u0000\n\u0002\u0018\u0002\n\u0000\n\u0002\u0018\u0002\n\u0002\b\t\n\u0002\u0010\u0002\n\u0002\b\t\n\u0002\u0010\u000e\n\u0002\b\t\n\u0002\u0018\u0002\n\u0000\b\u0007\u0018\u00002\u00020\u0001B7\b\u0007\u0012\u0006\u0010\u0002\u001a\u00020\u0003\u0012\u0006\u0010\u0004\u001a\u00020\u0005\u0012\u0006\u0010\u0006\u001a\u00020\u0007\u0012\u0006\u0010\b\u001a\u00020\t\u0012\u0006\u0010\n\u001a\u00020\u000b\u0012\u0006\u0010\f\u001a\u00020\r\u00a2\u0006\u0002\u0010\u000eJ\u0006\u0010#\u001a\u00020$J\u0006\u0010%\u001a\u00020$J\u0006\u0010&\u001a\u00020$J\u0010\u0010\'\u001a\u00020$2\u0006\u0010\u001f\u001a\u00020\u0016H\u0002J\b\u0010(\u001a\u00020$H\u0002J\b\u0010)\u001a\u00020$H\u0002J\u000e\u0010*\u001a\u00020$2\u0006\u0010+\u001a\u00020\u0016J\u000e\u0010,\u001a\u00020$2\u0006\u0010-\u001a\u00020.J\u000e\u0010/\u001a\u00020$2\u0006\u00100\u001a\u00020.J\u000e\u00101\u001a\u00020$2\u0006\u0010-\u001a\u00020.J\u000e\u00102\u001a\u00020$2\u0006\u00103\u001a\u00020.J\u0006\u00104\u001a\u00020$J\u0006\u00105\u001a\u00020$J\u0010\u00106\u001a\u00020$2\b\b\u0002\u00107\u001a\u000208R\u001a\u0010\u000f\u001a\u000e\u0012\n\u0012\b\u0012\u0004\u0012\u00020\u00120\u00110\u0010X\u0082\u0004\u00a2\u0006\u0002\n\u0000R\u0014\u0010\u0013\u001a\b\u0012\u0004\u0012\u00020\u00140\u0010X\u0082\u0004\u00a2\u0006\u0002\n\u0000R\u0016\u0010\u0015\u001a\n\u0012\u0006\u0012\u0004\u0018\u00010\u00160\u0010X\u0082\u0004\u00a2\u0006\u0002\n\u0000R\u0016\u0010\u0017\u001a\n\u0012\u0006\u0012\u0004\u0018\u00010\u00180\u0010X\u0082\u0004\u00a2\u0006\u0002\n\u0000R\u000e\u0010\u0002\u001a\u00020\u0003X\u0082\u0004\u00a2\u0006\u0002\n\u0000R\u000e\u0010\u0006\u001a\u00020\u0007X\u0082\u0004\u00a2\u0006\u0002\n\u0000R\u001d\u0010\u0019\u001a\u000e\u0012\n\u0012\b\u0012\u0004\u0012\u00020\u00120\u00110\u001a\u00a2\u0006\b\n\u0000\u001a\u0004\b\u001b\u0010\u001cR\u000e\u0010\u0004\u001a\u00020\u0005X\u0082\u0004\u00a2\u0006\u0002\n\u0000R\u000e\u0010\b\u001a\u00020\tX\u0082\u0004\u00a2\u0006\u0002\n\u0000R\u000e\u0010\n\u001a\u00020\u000bX\u0082\u0004\u00a2\u0006\u0002\n\u0000R\u000e\u0010\f\u001a\u00020\rX\u0082\u0004\u00a2\u0006\u0002\n\u0000R\u0017\u0010\u001d\u001a\b\u0012\u0004\u0012\u00020\u00140\u001a\u00a2\u0006\b\n\u0000\u001a\u0004\b\u001e\u0010\u001cR\u0019\u0010\u001f\u001a\n\u0012\u0006\u0012\u0004\u0018\u00010\u00160\u001a\u00a2\u0006\b\n\u0000\u001a\u0004\b \u0010\u001cR\u0019\u0010!\u001a\n\u0012\u0006\u0012\u0004\u0018\u00010\u00180\u001a\u00a2\u0006\b\n\u0000\u001a\u0004\b\"\u0010\u001c\u00a8\u00069"}, d2 = {"Lcom/guardian/safety/ui/viewmodel/IndexViewModel;", "Landroidx/lifecycle/ViewModel;", "authRepository", "Lcom/guardian/safety/data/auth/AuthRepository;", "locationRepository", "Lcom/guardian/safety/data/location/LocationRepository;", "emergencyContactRepository", "Lcom/guardian/safety/data/contacts/EmergencyContactRepository;", "placesRepository", "Lcom/guardian/safety/data/places/PlacesRepository;", "routingRepository", "Lcom/guardian/safety/data/routing/RoutingRepository;", "sosService", "Lcom/guardian/safety/services/SOSService;", "(Lcom/guardian/safety/data/auth/AuthRepository;Lcom/guardian/safety/data/location/LocationRepository;Lcom/guardian/safety/data/contacts/EmergencyContactRepository;Lcom/guardian/safety/data/places/PlacesRepository;Lcom/guardian/safety/data/routing/RoutingRepository;Lcom/guardian/safety/services/SOSService;)V", "_emergencyContacts", "Lkotlinx/coroutines/flow/MutableStateFlow;", "", "Lcom/guardian/safety/data/model/EmergencyContact;", "_uiState", "Lcom/guardian/safety/ui/viewmodel/IndexUiState;", "_userLocation", "Lcom/google/android/gms/maps/model/LatLng;", "_userProfile", "Lcom/guardian/safety/data/model/UserProfile;", "emergencyContacts", "Lkotlinx/coroutines/flow/StateFlow;", "getEmergencyContacts", "()Lkotlinx/coroutines/flow/StateFlow;", "uiState", "getUiState", "userLocation", "getUserLocation", "userProfile", "getUserProfile", "cancelSOS", "", "clearRoute", "getCurrentLocation", "loadNearbyPlaces", "observeAuthState", "observeLocation", "setDestination", "destination", "setFromLocation", "location", "", "setSelectedTab", "tab", "setToLocation", "setTravelMode", "mode", "shareLocation", "startNavigation", "triggerSOS", "emergencyType", "Lcom/guardian/safety/services/EmergencyType;", "app_debug"})
@dagger.hilt.android.lifecycle.HiltViewModel()
public final class IndexViewModel extends androidx.lifecycle.ViewModel {
    @org.jetbrains.annotations.NotNull()
    private final com.guardian.safety.data.auth.AuthRepository authRepository = null;
    @org.jetbrains.annotations.NotNull()
    private final com.guardian.safety.data.location.LocationRepository locationRepository = null;
    @org.jetbrains.annotations.NotNull()
    private final com.guardian.safety.data.contacts.EmergencyContactRepository emergencyContactRepository = null;
    @org.jetbrains.annotations.NotNull()
    private final com.guardian.safety.data.places.PlacesRepository placesRepository = null;
    @org.jetbrains.annotations.NotNull()
    private final com.guardian.safety.data.routing.RoutingRepository routingRepository = null;
    @org.jetbrains.annotations.NotNull()
    private final com.guardian.safety.services.SOSService sosService = null;
    @org.jetbrains.annotations.NotNull()
    private final kotlinx.coroutines.flow.MutableStateFlow<com.guardian.safety.ui.viewmodel.IndexUiState> _uiState = null;
    @org.jetbrains.annotations.NotNull()
    private final kotlinx.coroutines.flow.StateFlow<com.guardian.safety.ui.viewmodel.IndexUiState> uiState = null;
    @org.jetbrains.annotations.NotNull()
    private final kotlinx.coroutines.flow.MutableStateFlow<com.guardian.safety.data.model.UserProfile> _userProfile = null;
    @org.jetbrains.annotations.NotNull()
    private final kotlinx.coroutines.flow.StateFlow<com.guardian.safety.data.model.UserProfile> userProfile = null;
    @org.jetbrains.annotations.NotNull()
    private final kotlinx.coroutines.flow.MutableStateFlow<com.google.android.gms.maps.model.LatLng> _userLocation = null;
    @org.jetbrains.annotations.NotNull()
    private final kotlinx.coroutines.flow.StateFlow<com.google.android.gms.maps.model.LatLng> userLocation = null;
    @org.jetbrains.annotations.NotNull()
    private final kotlinx.coroutines.flow.MutableStateFlow<java.util.List<com.guardian.safety.data.model.EmergencyContact>> _emergencyContacts = null;
    @org.jetbrains.annotations.NotNull()
    private final kotlinx.coroutines.flow.StateFlow<java.util.List<com.guardian.safety.data.model.EmergencyContact>> emergencyContacts = null;
    
    @javax.inject.Inject()
    public IndexViewModel(@org.jetbrains.annotations.NotNull()
    com.guardian.safety.data.auth.AuthRepository authRepository, @org.jetbrains.annotations.NotNull()
    com.guardian.safety.data.location.LocationRepository locationRepository, @org.jetbrains.annotations.NotNull()
    com.guardian.safety.data.contacts.EmergencyContactRepository emergencyContactRepository, @org.jetbrains.annotations.NotNull()
    com.guardian.safety.data.places.PlacesRepository placesRepository, @org.jetbrains.annotations.NotNull()
    com.guardian.safety.data.routing.RoutingRepository routingRepository, @org.jetbrains.annotations.NotNull()
    com.guardian.safety.services.SOSService sosService) {
        super();
    }
    
    @org.jetbrains.annotations.NotNull()
    public final kotlinx.coroutines.flow.StateFlow<com.guardian.safety.ui.viewmodel.IndexUiState> getUiState() {
        return null;
    }
    
    @org.jetbrains.annotations.NotNull()
    public final kotlinx.coroutines.flow.StateFlow<com.guardian.safety.data.model.UserProfile> getUserProfile() {
        return null;
    }
    
    @org.jetbrains.annotations.NotNull()
    public final kotlinx.coroutines.flow.StateFlow<com.google.android.gms.maps.model.LatLng> getUserLocation() {
        return null;
    }
    
    @org.jetbrains.annotations.NotNull()
    public final kotlinx.coroutines.flow.StateFlow<java.util.List<com.guardian.safety.data.model.EmergencyContact>> getEmergencyContacts() {
        return null;
    }
    
    private final void observeAuthState() {
    }
    
    private final void observeLocation() {
    }
    
    private final void loadNearbyPlaces(com.google.android.gms.maps.model.LatLng userLocation) {
    }
    
    public final void setFromLocation(@org.jetbrains.annotations.NotNull()
    java.lang.String location) {
    }
    
    public final void setToLocation(@org.jetbrains.annotations.NotNull()
    java.lang.String location) {
    }
    
    public final void setTravelMode(@org.jetbrains.annotations.NotNull()
    java.lang.String mode) {
    }
    
    public final void startNavigation() {
    }
    
    public final void clearRoute() {
    }
    
    public final void setDestination(@org.jetbrains.annotations.NotNull()
    com.google.android.gms.maps.model.LatLng destination) {
    }
    
    public final void setSelectedTab(@org.jetbrains.annotations.NotNull()
    java.lang.String tab) {
    }
    
    public final void getCurrentLocation() {
    }
    
    public final void shareLocation() {
    }
    
    public final void triggerSOS(@org.jetbrains.annotations.NotNull()
    com.guardian.safety.services.EmergencyType emergencyType) {
    }
    
    public final void cancelSOS() {
    }
}