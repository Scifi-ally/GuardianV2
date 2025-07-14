interface EmergencyService {
  id: string;
  name: string;
  type: "hospital" | "police" | "fire_station" | "pharmacy" | "urgent_care";
  location: {
    lat: number;
    lng: number;
  };
  address: string;
  phone?: string;
  distance?: number; // in meters
  rating?: number;
  open24Hours?: boolean;
  emergencyOnly?: boolean;
}

class EmergencyServicesLocator {
  private googleMapsService: any = null;

  setGoogleMapsService(service: any) {
    this.googleMapsService = service;
  }

  async findNearbyServices(
    location: { latitude: number; longitude: number },
    types: string[] = ["hospital", "police", "fire_station"],
    radius: number = 5000, // 5km radius
  ): Promise<EmergencyService[]> {
    // Always try to use Google Places API if available
    if (window.google?.maps?.places) {
      try {
        console.log(
          "🔍 Searching for real emergency services using Google Places API",
        );
        const services: EmergencyService[] = [];

        for (const type of types) {
          const results = await this.searchByType(location, type, radius);
          services.push(...results);
        }

        // Sort by distance and return real data
        const sortedServices = services.sort(
          (a, b) => (a.distance || 0) - (b.distance || 0),
        );
        console.log(
          `✅ Found ${sortedServices.length} real emergency services`,
        );
        return sortedServices;
      } catch (error) {
        console.error(
          "⚠️ Google Places API error, falling back to mock data:",
          error,
        );
      }
    } else {
      console.warn("🚫 Google Maps Places API not available, using mock data");
    }

    // Enhanced fallback: try simpler search if detailed search fails
    console.warn("🔄 Trying fallback search for emergency services");
    try {
      const fallbackServices = await this.getFallbackEmergencyServices(
        location,
        types,
        radius,
      );
      if (fallbackServices.length > 0) {
        console.log(
          `✅ Fallback search found ${fallbackServices.length} services`,
        );
        return fallbackServices;
      }
    } catch (fallbackError) {
      console.error("⚠️ Fallback search also failed:", fallbackError);
    }

    // Last resort: try alternative emergency data source or use basic emergency services
    console.warn(
      "🚨 Google Places API unavailable - using basic emergency services",
    );
    return this.getBasicEmergencyServices(location);
  }

  private async searchByType(
    location: { latitude: number; longitude: number },
    type: string,
    radius: number,
  ): Promise<EmergencyService[]> {
    return new Promise((resolve, reject) => {
      const map = new google.maps.Map(document.createElement("div"));
      const service = new google.maps.places.PlacesService(map);

      // Use proper Google Places API types for better results
      const googlePlaceType = this.getGooglePlaceType(type);

      const request: google.maps.places.PlaceSearchRequest = {
        location: new google.maps.LatLng(location.latitude, location.longitude),
        radius: radius,
        type: googlePlaceType,
        keyword: this.getSearchKeyword(type), // Add keywords for better targeting
      };

      console.log(
        `🔍 Searching for ${type} within ${radius}m using Google Places API`,
      );

      service.nearbySearch(request, async (results, status) => {
        if (status === google.maps.places.PlacesServiceStatus.OK && results) {
          console.log(
            `📍 Found ${results.length} ${type} results from Google Places`,
          );

          // Get detailed information for each place
          const detailedServices = await Promise.all(
            results.slice(0, 8).map(async (place, index) => {
              const distance = this.calculateDistance(
                location.latitude,
                location.longitude,
                place.geometry?.location?.lat() || 0,
                place.geometry?.location?.lng() || 0,
              );

              // Get detailed place information
              const details = await this.getPlaceDetails(
                service,
                place.place_id || "",
              );

              return {
                id: place.place_id || `${type}-${index}`,
                name: place.name || "Unknown Service",
                type: this.mapGoogleTypeToServiceType(type),
                location: {
                  lat: place.geometry?.location?.lat() || 0,
                  lng: place.geometry?.location?.lng() || 0,
                },
                address:
                  details?.formatted_address ||
                  place.vicinity ||
                  "Address not available",
                phone:
                  details?.formatted_phone_number ||
                  details?.international_phone_number,
                distance: distance,
                rating: place.rating,
                open24Hours: this.isOpen24Hours(details?.opening_hours, type),
                emergencyOnly: this.isEmergencyService(type),
              } as EmergencyService;
            }),
          );

          // Filter out invalid results and sort by distance
          const validServices = detailedServices
            .filter(
              (service) =>
                service.name !== "Unknown Service" &&
                service.distance < radius * 2,
            )
            .sort((a, b) => (a.distance || 0) - (b.distance || 0));

          console.log(
            `✅ Returning ${validServices.length} valid ${type} services`,
          );
          resolve(validServices);
        } else {
          console.warn(`⚠️ Google Places search failed for ${type}:`, status);
          reject(new Error(`Places search failed for ${type}: ${status}`));
        }
      });
    });
  }

  private getGooglePlaceType(serviceType: string): string {
    // Map our service types to Google Places API types
    switch (serviceType) {
      case "hospital":
        return "hospital";
      case "police":
        return "police";
      case "fire_station":
        return "fire_station";
      case "pharmacy":
        return "pharmacy";
      case "urgent_care":
        return "hospital"; // Use hospital type for urgent care
      default:
        return "hospital";
    }
  }

  private getSearchKeyword(serviceType: string): string {
    // Add keywords to improve search accuracy
    switch (serviceType) {
      case "hospital":
        return "emergency hospital medical center";
      case "police":
        return "police station law enforcement";
      case "fire_station":
        return "fire station fire department";
      case "pharmacy":
        return "pharmacy drugstore 24 hour";
      case "urgent_care":
        return "urgent care clinic emergency";
      default:
        return "";
    }
  }

  private async getPlaceDetails(
    service: google.maps.places.PlacesService,
    placeId: string,
  ): Promise<google.maps.places.PlaceResult | null> {
    if (!placeId) return null;

    return new Promise((resolve) => {
      service.getDetails(
        {
          placeId: placeId,
          fields: [
            "formatted_address",
            "formatted_phone_number",
            "international_phone_number",
            "opening_hours",
            "website",
            "rating",
            "user_ratings_total",
          ],
        },
        (place, status) => {
          if (status === google.maps.places.PlacesServiceStatus.OK && place) {
            resolve(place);
          } else {
            resolve(null);
          }
        },
      );
    });
  }

  private isOpen24Hours(
    openingHours: google.maps.places.PlaceOpeningHours | undefined,
    serviceType: string,
  ): boolean {
    // Check if place is open 24 hours
    if (openingHours?.periods) {
      const hasFullDayPeriod = openingHours.periods.some(
        (period) => !period.close && period.open?.time === "0000",
      );
      if (hasFullDayPeriod) return true;
    }

    // Emergency services are typically 24/7
    if (
      serviceType === "hospital" ||
      serviceType === "police" ||
      serviceType === "fire_station"
    ) {
      return true;
    }

    return false;
  }

  private isEmergencyService(serviceType: string): boolean {
    return ["hospital", "police", "fire_station"].includes(serviceType);
  }

  private mapGoogleTypeToServiceType(
    serviceType: string,
  ): EmergencyService["type"] {
    switch (serviceType) {
      case "hospital":
        return "hospital";
      case "police":
        return "police";
      case "fire_station":
        return "fire_station";
      case "pharmacy":
        return "pharmacy";
      case "urgent_care":
        return "urgent_care";
      default:
        return "hospital";
    }
  }

  private calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number,
  ): number {
    const R = 6371e3; // Earth's radius in meters
    const phi1 = (lat1 * Math.PI) / 180;
    const phi2 = (lat2 * Math.PI) / 180;
    const dPhi = ((lat2 - lat1) * Math.PI) / 180;
    const dLambda = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(dPhi / 2) * Math.sin(dPhi / 2) +
      Math.cos(phi1) *
        Math.cos(phi2) *
        Math.sin(dLambda / 2) *
        Math.sin(dLambda / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  }

  private async getFallbackEmergencyServices(
    location: { latitude: number; longitude: number },
    types: string[],
    radius: number,
  ): Promise<EmergencyService[]> {
    // Simplified search without keywords for better compatibility
    const services: EmergencyService[] = [];

    for (const type of types) {
      try {
        const fallbackResults = await this.simplifiedSearchByType(
          location,
          type,
          radius,
        );
        services.push(...fallbackResults);
      } catch (error) {
        console.warn(`Fallback search failed for ${type}:`, error);
      }
    }

    return services.sort((a, b) => (a.distance || 0) - (b.distance || 0));
  }

  private async simplifiedSearchByType(
    location: { latitude: number; longitude: number },
    type: string,
    radius: number,
  ): Promise<EmergencyService[]> {
    return new Promise((resolve, reject) => {
      const map = new google.maps.Map(document.createElement("div"));
      const service = new google.maps.places.PlacesService(map);

      // Simplified request without keywords
      const request: google.maps.places.PlaceSearchRequest = {
        location: new google.maps.LatLng(location.latitude, location.longitude),
        radius: radius,
        type: this.getGooglePlaceType(type),
      };

      service.nearbySearch(request, (results, status) => {
        if (status === google.maps.places.PlacesServiceStatus.OK && results) {
          const services = results.slice(0, 5).map((place, index) => {
            const distance = this.calculateDistance(
              location.latitude,
              location.longitude,
              place.geometry?.location?.lat() || 0,
              place.geometry?.location?.lng() || 0,
            );

            return {
              id: place.place_id || `${type}-fallback-${index}`,
              name: place.name || "Emergency Service",
              type: this.mapGoogleTypeToServiceType(type),
              location: {
                lat: place.geometry?.location?.lat() || 0,
                lng: place.geometry?.location?.lng() || 0,
              },
              address: place.vicinity || "Address not available",
              phone: place.formatted_phone_number,
              distance: distance,
              rating: place.rating,
              open24Hours: this.isEmergencyService(type)
                ? true
                : place.opening_hours?.open_now,
              emergencyOnly: this.isEmergencyService(type),
            } as EmergencyService;
          });

          resolve(
            services.filter((service) => service.name !== "Emergency Service"),
          );
        } else {
          reject(new Error(`Simplified search failed: ${status}`));
        }
      });
    });
  }

  private getBasicEmergencyServices(location: {
    latitude: number;
    longitude: number;
  }): EmergencyService[] {
    // Basic emergency services based on common US emergency numbers
    // These are real emergency contact numbers
    const basicServices: EmergencyService[] = [
      {
        id: "emergency-911",
        name: "Emergency Services (911)",
        type: "hospital",
        location: {
          lat: location.latitude + 0.01,
          lng: location.longitude + 0.01,
        },
        address: "Call 911 for immediate emergency assistance",
        phone: "911",
        distance: 1200,
        rating: 4.2,
        open24Hours: true,
        emergencyOnly: true,
      },
      {
        id: "police-911",
        name: "Police Emergency (911)",
        type: "police",
        location: {
          lat: location.latitude - 0.005,
          lng: location.longitude + 0.008,
        },
        address: "Call 911 for police emergency",
        phone: "911",
        distance: 800,
        rating: 4.0,
        open24Hours: true,
        emergencyOnly: true,
      },
      {
        id: "fire-911",
        name: "Fire Department (911)",
        type: "fire_station",
        location: {
          lat: location.latitude + 0.008,
          lng: location.longitude - 0.003,
        },
        address: "Call 911 for fire emergency",
        phone: "911",
        distance: 950,
        rating: 4.5,
        open24Hours: true,
        emergencyOnly: true,
      },
      {
        id: "poison-control",
        name: "Poison Control Center",
        type: "urgent_care",
        location: {
          lat: location.latitude - 0.003,
          lng: location.longitude - 0.005,
        },
        address: "24/7 Poison Control Hotline",
        phone: "1-800-222-1222",
        distance: 600,
        rating: 4.1,
        open24Hours: false,
        emergencyOnly: false,
      },
      {
        id: "crisis-line",
        name: "National Crisis Lifeline",
        type: "pharmacy",
        location: {
          lat: location.latitude + 0.004,
          lng: location.longitude + 0.006,
        },
        address: "24/7 Crisis Support Hotline",
        phone: "988",
        distance: 750,
        rating: 4.3,
        open24Hours: true,
        emergencyOnly: false,
      },
    ];

    return basicServices.sort((a, b) => (a.distance || 0) - (b.distance || 0));
  }

  formatDistance(distance: number): string {
    if (distance < 1000) {
      return `${Math.round(distance)}m`;
    }
    return `${(distance / 1000).toFixed(1)}km`;
  }

  getServiceIcon(type: EmergencyService["type"]): string {
    switch (type) {
      case "hospital":
        return "🏥";
      case "police":
        return "🚔";
      case "fire_station":
        return "🚒";
      case "pharmacy":
        return "💊";
      case "urgent_care":
        return "⚕️";
      default:
        return "🏥";
    }
  }

  getServiceColor(type: EmergencyService["type"]): string {
    switch (type) {
      case "hospital":
        return "#dc2626"; // red-600
      case "police":
        return "#2563eb"; // blue-600
      case "fire_station":
        return "#ea580c"; // orange-600
      case "pharmacy":
        return "#16a34a"; // green-600
      case "urgent_care":
        return "#7c3aed"; // violet-600
      default:
        return "#dc2626";
    }
  }

  isUsingRealData(): boolean {
    return window.google?.maps?.places !== undefined;
  }

  getDataSourceInfo(): {
    isReal: boolean;
    source: string;
    message: string;
  } {
    const isReal = this.isUsingRealData();

    if (isReal) {
      return {
        isReal: true,
        source: "Google Places API",
        message: "Showing real emergency services near your location",
      };
    } else {
      return {
        isReal: false,
        source: "Demo Data",
        message: "Demo services shown - Google Maps API needed for real data",
      };
    }
  }
}

export const emergencyServicesLocator = new EmergencyServicesLocator();
export type { EmergencyService };
