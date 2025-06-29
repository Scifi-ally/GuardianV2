export interface LocationData {
  latitude: number;
  longitude: number;
  accuracy?: number;
  timestamp: number;
}

export class LocationService {
  private static watchId: number | null = null;

  static async getCurrentLocation(): Promise<LocationData> {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error("Geolocation is not supported by this browser."));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            timestamp: position.timestamp,
          });
        },
        (error) => {
          reject(error);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000,
        },
      );
    });
  }

  static watchLocation(
    onLocationUpdate: (location: LocationData) => void,
    onError?: (error: GeolocationPositionError) => void,
  ): () => void {
    if (!navigator.geolocation) {
      onError?.(new Error("Geolocation not supported") as any);
      return () => {};
    }

    this.watchId = navigator.geolocation.watchPosition(
      (position) => {
        onLocationUpdate({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: position.timestamp,
        });
      },
      onError,
      {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 30000,
      },
    );

    return () => {
      if (this.watchId !== null) {
        navigator.geolocation.clearWatch(this.watchId);
        this.watchId = null;
      }
    };
  }

  static stopWatching(): void {
    if (this.watchId !== null) {
      navigator.geolocation.clearWatch(this.watchId);
      this.watchId = null;
    }
  }

  static navigateToLocation(
    latitude: number,
    longitude: number,
    label?: string,
  ): void {
    const isMobile =
      /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        navigator.userAgent,
      );

    if (isMobile) {
      // Try to open in native maps app
      const url = `https://maps.google.com/maps?daddr=${latitude},${longitude}${
        label ? `&label=${encodeURIComponent(label)}` : ""
      }`;
      window.open(url, "_blank");
    } else {
      // Open in Google Maps web
      const url = `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}${
        label ? `&destination_place_id=${encodeURIComponent(label)}` : ""
      }`;
      window.open(url, "_blank");
    }
  }

  static calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number,
  ): number {
    const R = 6371; // Radius of the Earth in kilometers
    const dLat = this.deg2rad(lat2 - lat1);
    const dLon = this.deg2rad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.deg2rad(lat1)) *
        Math.cos(this.deg2rad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const d = R * c; // Distance in kilometers
    return d;
  }

  private static deg2rad(deg: number): number {
    return deg * (Math.PI / 180);
  }

  static formatDistance(kilometers: number): string {
    if (kilometers < 1) {
      return `${Math.round(kilometers * 1000)}m`;
    }
    return `${kilometers.toFixed(1)}km`;
  }

  static shareLocation(
    latitude: number,
    longitude: number,
    message?: string,
  ): Promise<void> {
    const locationUrl = `https://maps.google.com/?q=${latitude},${longitude}`;
    const shareText = message || "My current location";

    if (navigator.share) {
      return navigator.share({
        title: "Guardian Location",
        text: shareText,
        url: locationUrl,
      });
    } else {
      // Fallback to clipboard
      return navigator.clipboard
        .writeText(`${shareText}: ${locationUrl}`)
        .then(() => {
          // Show notification or toast that location was copied
          console.log("Location copied to clipboard");
        });
    }
  }
}
