export interface RoutePoint {
  lat: number;
  lng: number;
  name?: string;
  type?: "start" | "end" | "waypoint";
}

export interface Route {
  id: string;
  name: string;
  description: string;
  points: RoutePoint[];
  distance: string;
  duration: string;
  safetyLevel: "high" | "medium" | "low";
  features: string[];
  color: string;
  isActive?: boolean;
}

export interface SafePlace {
  id: string;
  name: string;
  type: "police" | "hospital" | "fire" | "shelter" | "store" | "transport";
  location: RoutePoint;
  distance: string;
  isOpen24h: boolean;
  rating: number;
}

export class RoutingService {
  private static routes: Route[] = [
    {
      id: "route-1",
      name: "Home to Work",
      description: "Safest route to workplace",
      points: [
        { lat: 37.7749, lng: -122.4194, name: "Home", type: "start" },
        { lat: 37.7849, lng: -122.4094, name: "Safe Street", type: "waypoint" },
        { lat: 37.7949, lng: -122.3994, name: "Workplace", type: "end" },
      ],
      distance: "2.3 km",
      duration: "15 min",
      safetyLevel: "high",
      features: ["Well-lit", "CCTV coverage", "Police patrol", "Busy area"],
      color: "#10b981",
      isActive: false,
    },
    {
      id: "route-2",
      name: "University Route",
      description: "Safe path to campus",
      points: [
        { lat: 37.7749, lng: -122.4194, name: "Home", type: "start" },
        { lat: 37.7649, lng: -122.4094, name: "Main Street", type: "waypoint" },
        { lat: 37.7549, lng: -122.3994, name: "University", type: "end" },
      ],
      distance: "1.8 km",
      duration: "12 min",
      safetyLevel: "medium",
      features: ["Emergency stations", "Some dark areas", "Student area"],
      color: "#f59e0b",
      isActive: false,
    },
    {
      id: "route-3",
      name: "Night Safe Route",
      description: "24/7 monitored pathway",
      points: [
        { lat: 37.7749, lng: -122.4194, name: "Home", type: "start" },
        { lat: 37.7849, lng: -122.4294, name: "24h Street", type: "waypoint" },
        { lat: 37.7949, lng: -122.4394, name: "Destination", type: "end" },
      ],
      distance: "2.8 km",
      duration: "18 min",
      safetyLevel: "high",
      features: ["24/7 security", "Well-populated", "Emergency buttons"],
      color: "#8b5cf6",
      isActive: false,
    },
  ];

  private static safePlaces: SafePlace[] = [
    {
      id: "police-1",
      name: "Central Police Station",
      type: "police",
      location: { lat: 37.7849, lng: -122.4094, name: "Police Station" },
      distance: "0.3 km",
      isOpen24h: true,
      rating: 5,
    },
    {
      id: "hospital-1",
      name: "City General Hospital",
      type: "hospital",
      location: { lat: 37.7649, lng: -122.4294, name: "Hospital" },
      distance: "0.7 km",
      isOpen24h: true,
      rating: 4.5,
    },
    {
      id: "fire-1",
      name: "Fire Station 12",
      type: "fire",
      location: { lat: 37.7949, lng: -122.4194, name: "Fire Station" },
      distance: "0.5 km",
      isOpen24h: true,
      rating: 5,
    },
    {
      id: "shelter-1",
      name: "Safe Haven Center",
      type: "shelter",
      location: { lat: 37.7549, lng: -122.4394, name: "Safe Haven" },
      distance: "1.2 km",
      isOpen24h: true,
      rating: 4.8,
    },
    {
      id: "store-1",
      name: "24/7 Convenience Store",
      type: "store",
      location: { lat: 37.7749, lng: -122.4094, name: "Store" },
      distance: "0.2 km",
      isOpen24h: true,
      rating: 4.2,
    },
  ];

  static getAllRoutes(): Route[] {
    return [...this.routes];
  }

  static getActiveRoute(): Route | null {
    return this.routes.find((route) => route.isActive) || null;
  }

  static activateRoute(routeId: string): void {
    this.routes = this.routes.map((route) => ({
      ...route,
      isActive: route.id === routeId,
    }));
  }

  static deactivateAllRoutes(): void {
    this.routes = this.routes.map((route) => ({
      ...route,
      isActive: false,
    }));
  }

  static getSafePlaces(): SafePlace[] {
    return [...this.safePlaces];
  }

  static getSafePlacesByType(type: SafePlace["type"]): SafePlace[] {
    return this.safePlaces.filter((place) => place.type === type);
  }

  static findNearestSafePlace(
    userLocation: RoutePoint,
    type?: SafePlace["type"],
  ): SafePlace | null {
    const places = type ? this.getSafePlacesByType(type) : this.getSafePlaces();

    if (places.length === 0) return null;

    // For demo purposes, return the first place
    // In a real app, you'd calculate actual distances
    return places[0];
  }

  static calculateRoute(
    start: RoutePoint,
    end: RoutePoint,
    safetyPriority: boolean = true,
  ): Route {
    // Mock route calculation
    const mockRoute: Route = {
      id: `route-${Date.now()}`,
      name: `Route to ${end.name || "Destination"}`,
      description: safetyPriority ? "Safest route" : "Fastest route",
      points: [
        { ...start, type: "start" },
        {
          lat: (start.lat + end.lat) / 2,
          lng: (start.lng + end.lng) / 2,
          name: "Via Main Street",
          type: "waypoint",
        },
        { ...end, type: "end" },
      ],
      distance: "1.5 km",
      duration: "12 min",
      safetyLevel: safetyPriority ? "high" : "medium",
      features: safetyPriority
        ? ["Well-lit", "CCTV coverage", "Police patrol"]
        : ["Direct route", "Main roads"],
      color: safetyPriority ? "#10b981" : "#3b82f6",
      isActive: true,
    };

    // Add to routes list
    this.routes.push(mockRoute);
    this.activateRoute(mockRoute.id);

    return mockRoute;
  }

  static shareRoute(route: Route): string {
    const routeUrl = `https://guardian-app.com/route/${route.id}`;
    const shareText = `Check out this safe route: ${route.name}\nDistance: ${route.distance}\nSafety: ${route.safetyLevel}\n${routeUrl}`;

    if (navigator.share) {
      navigator
        .share({
          title: `Guardian Route: ${route.name}`,
          text: shareText,
          url: routeUrl,
        })
        .catch(console.error);
    } else {
      navigator.clipboard.writeText(shareText).catch(console.error);
    }

    return shareText;
  }

  static getRouteInstructions(route: Route): string[] {
    return [
      `Start at ${route.points[0].name || "your location"}`,
      ...route.points.slice(1, -1).map((point) => `Continue via ${point.name}`),
      `Arrive at ${route.points[route.points.length - 1].name || "destination"}`,
      `Total distance: ${route.distance}`,
      `Estimated time: ${route.duration}`,
    ];
  }
}
