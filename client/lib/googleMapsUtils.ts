/**
 * Google Maps API Utility Functions
 * Provides reliable Google Maps API initialization and management
 */

export const GOOGLE_MAPS_API_KEY =
  import.meta.env.VITE_GOOGLE_MAPS_API_KEY ||
  "AIzaSyA41wHVKnsb1RNhcftpHS5qNwvYz59nXIE";

export const GOOGLE_MAPS_LIBRARIES: ("geometry" | "places")[] = [
  "geometry",
  "places",
];

/**
 * Check if Google Maps API is loaded
 */
export function isGoogleMapsLoaded(): boolean {
  return !!(window as any).google?.maps?.places;
}

/**
 * Wait for Google Maps API to load
 */
export function waitForGoogleMaps(): Promise<void> {
  return new Promise((resolve, reject) => {
    // Already loaded
    if (isGoogleMapsLoaded()) {
      console.log("✅ Google Maps API already available");
      resolve();
      return;
    }

    // Check if loading failed
    if ((window as any).googleMapsError) {
      reject(new Error("Google Maps API failed to load"));
      return;
    }

    // Wait for load event
    const handleLoad = () => {
      console.log("✅ Google Maps API loaded via event");
      window.removeEventListener("googleMapsLoaded", handleLoad);
      resolve();
    };

    window.addEventListener("googleMapsLoaded", handleLoad);

    // Fallback timeout
    setTimeout(() => {
      if (isGoogleMapsLoaded()) {
        window.removeEventListener("googleMapsLoaded", handleLoad);
        resolve();
      } else {
        window.removeEventListener("googleMapsLoaded", handleLoad);
        reject(new Error("Timeout waiting for Google Maps API"));
      }
    }, 10000); // 10 second timeout
  });
}

/**
 * Load Google Maps API dynamically if not already loaded
 */
export function loadGoogleMaps(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (isGoogleMapsLoaded()) {
      resolve();
      return;
    }

    // Check if already loading
    if (document.querySelector('script[src*="maps.googleapis.com"]')) {
      waitForGoogleMaps().then(resolve).catch(reject);
      return;
    }

    console.log("��️ Loading Google Maps API dynamically...");
    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=${GOOGLE_MAPS_LIBRARIES.join(",")}&loading=async`;
    script.async = true;
    script.defer = true;

    script.onload = () => {
      console.log("✅ Google Maps API loaded successfully");
      (window as any).googleMapsLoaded = true;
      window.dispatchEvent(new CustomEvent("googleMapsLoaded"));
      resolve();
    };

    script.onerror = () => {
      console.error("❌ Failed to load Google Maps API");
      (window as any).googleMapsError = true;
      reject(new Error("Failed to load Google Maps API"));
    };

    document.head.appendChild(script);
  });
}

/**
 * Initialize Google Places services
 */
export function initializePlacesServices(): {
  autocompleteService: google.maps.places.AutocompleteService | null;
  placesService: google.maps.places.PlacesService | null;
} {
  if (!isGoogleMapsLoaded()) {
    console.warn("⚠️ Google Maps API not loaded yet");
    return {
      autocompleteService: null,
      placesService: null,
    };
  }

  try {
    const autocompleteService = new google.maps.places.AutocompleteService();

    // Create a dummy map for PlacesService (required by Google)
    const mapDiv = document.createElement("div");
    const map = new google.maps.Map(mapDiv);
    const placesService = new google.maps.places.PlacesService(map);

    console.log("✅ Google Places services initialized");

    return {
      autocompleteService,
      placesService,
    };
  } catch (error) {
    console.error("❌ Failed to initialize Places services:", error);
    return {
      autocompleteService: null,
      placesService: null,
    };
  }
}

/**
 * Get user's current location
 */
export function getCurrentLocation(): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Geolocation is not supported"));
      return;
    }

    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 60000, // 1 minute cache
    });
  });
}
