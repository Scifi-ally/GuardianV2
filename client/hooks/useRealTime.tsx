/**
 * React Hook for Real-Time Data
 * Professional hook pattern for consuming real-time data with automatic cleanup
 */

import { useState, useEffect, useCallback } from "react";
import {
  unifiedRealTimeService,
  type RealTimeLocation,
  type RealTimeEmergencyContact,
  type RealTimeAlert,
  type RealTimeTraffic,
  type RealTimeStats,
} from "@/services/unifiedRealTimeService";

// Hook for real-time location
export function useRealTimeLocation() {
  const [location, setLocation] = useState<RealTimeLocation | null>(
    unifiedRealTimeService.getCurrentLocation(),
  );
  const [isTracking, setIsTracking] = useState(true);

  useEffect(() => {
    const handleLocationUpdate = (newLocation: RealTimeLocation) => {
      setLocation(newLocation);
    };

    const handleError = (error: Error) => {
      console.error("Real-time location error:", error);
      setIsTracking(false);
    };

    unifiedRealTimeService.on("location:update", handleLocationUpdate);
    unifiedRealTimeService.on("error", handleError);

    return () => {
      unifiedRealTimeService.off("location:update", handleLocationUpdate);
      unifiedRealTimeService.off("error", handleError);
    };
  }, []);

  return { location, isTracking };
}

// Hook for emergency contacts
export function useRealTimeContacts() {
  const [contacts, setContacts] = useState<RealTimeEmergencyContact[]>(
    unifiedRealTimeService.getEmergencyContacts(),
  );

  useEffect(() => {
    const handleContactsUpdate = (
      updatedContacts: RealTimeEmergencyContact[],
    ) => {
      setContacts(updatedContacts);
    };

    unifiedRealTimeService.on("contacts:update", handleContactsUpdate);

    return () => {
      unifiedRealTimeService.off("contacts:update", handleContactsUpdate);
    };
  }, []);

  const addContact = useCallback((contact: RealTimeEmergencyContact) => {
    unifiedRealTimeService.addEmergencyContact(contact);
  }, []);

  const removeContact = useCallback((contactId: string) => {
    unifiedRealTimeService.removeEmergencyContact(contactId);
  }, []);

  return { contacts, addContact, removeContact };
}

// Hook for real-time alerts
export function useRealTimeAlerts() {
  const [alerts, setAlerts] = useState<RealTimeAlert[]>(
    unifiedRealTimeService.getActiveAlerts(),
  );

  useEffect(() => {
    const handleNewAlert = (alert: RealTimeAlert) => {
      setAlerts((prev) => [alert, ...prev]);
    };

    const handleResolvedAlert = (alertId: string) => {
      setAlerts((prev) => prev.filter((alert) => alert.id !== alertId));
    };

    unifiedRealTimeService.on("alert:new", handleNewAlert);
    unifiedRealTimeService.on("alert:resolved", handleResolvedAlert);

    return () => {
      unifiedRealTimeService.off("alert:new", handleNewAlert);
      unifiedRealTimeService.off("alert:resolved", handleResolvedAlert);
    };
  }, []);

  const createAlert = useCallback(
    (alert: Omit<RealTimeAlert, "id" | "timestamp">) => {
      return unifiedRealTimeService.createAlert(alert);
    },
    [],
  );

  const resolveAlert = useCallback((alertId: string) => {
    unifiedRealTimeService.resolveAlert(alertId);
  }, []);

  return { alerts, createAlert, resolveAlert };
}

// Hook for traffic data
export function useRealTimeTraffic() {
  const [traffic, setTraffic] = useState<RealTimeTraffic | null>(
    unifiedRealTimeService.getCurrentTraffic(),
  );

  useEffect(() => {
    const handleTrafficUpdate = (trafficData: RealTimeTraffic) => {
      setTraffic(trafficData);
    };

    unifiedRealTimeService.on("traffic:update", handleTrafficUpdate);

    return () => {
      unifiedRealTimeService.off("traffic:update", handleTrafficUpdate);
    };
  }, []);

  return traffic;
}

// Hook for overall stats
export function useRealTimeStats() {
  const [stats, setStats] = useState<RealTimeStats | null>(
    unifiedRealTimeService.getStats(),
  );

  useEffect(() => {
    const handleStatsUpdate = (statsData: RealTimeStats) => {
      setStats(statsData);
    };

    unifiedRealTimeService.on("stats:update", handleStatsUpdate);

    return () => {
      unifiedRealTimeService.off("stats:update", handleStatsUpdate);
    };
  }, []);

  return stats;
}

// Hook for connection status
export function useRealTimeConnection() {
  const [connectionState, setConnectionState] = useState(
    unifiedRealTimeService.getConnectionState(),
  );

  useEffect(() => {
    const handleConnectionChange = (state: any) => {
      // Safety check for valid connection state
      const validStates = [
        "connected",
        "disconnected",
        "reconnecting",
        "connecting",
      ];
      if (typeof state === "string" && validStates.includes(state)) {
        setConnectionState(
          state as "connected" | "disconnected" | "reconnecting" | "connecting",
        );
      } else {
        console.warn("Invalid connection state received:", state);
        setConnectionState("disconnected");
      }
    };

    unifiedRealTimeService.on("connection:state", handleConnectionChange);

    return () => {
      unifiedRealTimeService.off("connection:state", handleConnectionChange);
    };
  }, []);

  return connectionState;
}

// Unified hook for all real-time data
export function useRealTime() {
  const location = useRealTimeLocation();
  const contacts = useRealTimeContacts();
  const alerts = useRealTimeAlerts();
  const traffic = useRealTimeTraffic();
  const stats = useRealTimeStats();
  const connectionState = useRealTimeConnection();

  return {
    location: location.location,
    isLocationTracking: location.isTracking,
    contacts: contacts.contacts,
    addContact: contacts.addContact,
    removeContact: contacts.removeContact,
    alerts: alerts.alerts,
    createAlert: alerts.createAlert,
    resolveAlert: alerts.resolveAlert,
    traffic,
    stats,
    connectionState,
  };
}
