interface LocationInfo {
  formattedAddress: string;
  city: string;
  state: string;
  country: string;
  postalCode?: string;
  neighborhood?: string;
  landmark?: string;
}

interface GeocodeResult {
  location: LocationInfo;
  accuracy: "exact" | "approximate" | "unknown";
  coordinates: {
    lat: number;
    lng: number;
  };
}

class GeocodingService {
  private cache = new Map<
    string,
    { result: GeocodeResult; timestamp: number }
  >();
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  private getCacheKey(lat: number, lng: number): string {
    return `${lat.toFixed(4)},${lng.toFixed(4)}`;
  }

  private isValidCache(timestamp: number): boolean {
    return Date.now() - timestamp < this.CACHE_DURATION;
  }

  async reverseGeocode(lat: number, lng: number): Promise<GeocodeResult> {
    const cacheKey = this.getCacheKey(lat, lng);
    const cached = this.cache.get(cacheKey);

    if (cached && this.isValidCache(cached.timestamp)) {
      console.log("📍 Using cached geocode result");
      return cached.result;
    }

    try {
      // Try Google Maps Geocoding API first
      const googleResult = await this.tryGoogleGeocoding(lat, lng);
      if (googleResult) {
        this.cache.set(cacheKey, {
          result: googleResult,
          timestamp: Date.now(),
        });
        return googleResult;
      }
    } catch (error) {
      console.warn("Google geocoding failed:", error);
    }

    try {
      // Fallback to OpenStreetMap Nominatim (free)
      const osmResult = await this.tryNominatimGeocoding(lat, lng);
      if (osmResult) {
        this.cache.set(cacheKey, { result: osmResult, timestamp: Date.now() });
        return osmResult;
      }
    } catch (error) {
      console.warn("OSM geocoding failed:", error);
    }

    // Fallback to basic location description
    return this.createFallbackResult(lat, lng);
  }

  private async tryGoogleGeocoding(
    lat: number,
    lng: number,
  ): Promise<GeocodeResult | null> {
    if (!window.google?.maps) {
      throw new Error("Google Maps not loaded");
    }

    return new Promise((resolve, reject) => {
      const geocoder = new google.maps.Geocoder();
      const latlng = { lat, lng };

      geocoder.geocode({ location: latlng }, (results, status) => {
        if (status === "OK" && results && results[0]) {
          const result = results[0];
          const location = this.parseGoogleResult(result);

          resolve({
            location,
            accuracy: "exact",
            coordinates: { lat, lng },
          });
        } else {
          reject(new Error(`Google geocoding failed: ${status}`));
        }
      });
    });
  }

  private async tryNominatimGeocoding(
    lat: number,
    lng: number,
  ): Promise<GeocodeResult | null> {
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`;

    const response = await fetch(url, {
      headers: {
        "User-Agent": "Guardian Safety App",
      },
    });

    if (!response.ok) {
      throw new Error(`Nominatim request failed: ${response.status}`);
    }

    const data = await response.json();

    if (data.display_name) {
      const location = this.parseNominatimResult(data);
      return {
        location,
        accuracy: "approximate",
        coordinates: { lat, lng },
      };
    }

    throw new Error("No result from Nominatim");
  }

  private parseGoogleResult(result: google.maps.GeocoderResult): LocationInfo {
    const components = result.address_components;
    const location: LocationInfo = {
      formattedAddress: result.formatted_address,
      city: "",
      state: "",
      country: "",
    };

    components.forEach((component) => {
      const types = component.types;

      if (types.includes("locality")) {
        location.city = component.long_name;
      } else if (types.includes("administrative_area_level_1")) {
        location.state = component.short_name;
      } else if (types.includes("country")) {
        location.country = component.long_name;
      } else if (types.includes("postal_code")) {
        location.postalCode = component.long_name;
      } else if (
        types.includes("neighborhood") ||
        types.includes("sublocality")
      ) {
        location.neighborhood = component.long_name;
      } else if (
        types.includes("establishment") ||
        types.includes("point_of_interest")
      ) {
        location.landmark = component.long_name;
      }
    });

    return location;
  }

  private parseNominatimResult(data: any): LocationInfo {
    const address = data.address || {};

    return {
      formattedAddress: data.display_name,
      city: address.city || address.town || address.village || "",
      state: address.state || address.region || "",
      country: address.country || "",
      postalCode: address.postcode,
      neighborhood: address.neighbourhood || address.suburb,
      landmark: data.name !== data.display_name ? data.name : undefined,
    };
  }

  private createFallbackResult(lat: number, lng: number): GeocodeResult {
    // Create a basic readable location description
    const latDir = lat >= 0 ? "N" : "S";
    const lngDir = lng >= 0 ? "E" : "W";

    const formattedAddress = `${Math.abs(lat).toFixed(3)}°${latDir}, ${Math.abs(lng).toFixed(3)}°${lngDir}`;

    return {
      location: {
        formattedAddress,
        city: "Unknown",
        state: "",
        country: "",
      },
      accuracy: "unknown",
      coordinates: { lat, lng },
    };
  }

  // Get a short, human-readable location name
  getShortLocationName(locationInfo: LocationInfo): string {
    if (locationInfo.landmark) {
      return locationInfo.landmark;
    }

    if (locationInfo.neighborhood && locationInfo.city) {
      return `${locationInfo.neighborhood}, ${locationInfo.city}`;
    }

    if (locationInfo.city && locationInfo.state) {
      return `${locationInfo.city}, ${locationInfo.state}`;
    }

    if (locationInfo.city) {
      return locationInfo.city;
    }

    return locationInfo.formattedAddress.split(",")[0] || "Unknown Location";
  }

  // Get formatted address for display
  getDisplayAddress(locationInfo: LocationInfo): string {
    return locationInfo.formattedAddress;
  }

  // Clear cache (useful for testing or memory management)
  clearCache(): void {
    this.cache.clear();
  }

  // Get cache stats
  getCacheStats(): { size: number; oldestEntry: number | null } {
    let oldestTimestamp: number | null = null;

    for (const [, value] of this.cache) {
      if (oldestTimestamp === null || value.timestamp < oldestTimestamp) {
        oldestTimestamp = value.timestamp;
      }
    }

    return {
      size: this.cache.size,
      oldestEntry: oldestTimestamp,
    };
  }
}

export const geocodingService = new GeocodingService();
export type { LocationInfo, GeocodeResult };
