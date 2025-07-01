import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { useAuth } from "./AuthContext";

interface SOSSettings {
  emergencyPassword: string;
  passwordProtected: boolean;
  autoResolveTime: number; // minutes
  requirePasswordToCancel: boolean;
}

interface SOSSettingsContextType {
  sosSettings: SOSSettings;
  updateSOSSettings: (settings: Partial<SOSSettings>) => Promise<void>;
  verifyPassword: (password: string) => boolean;
  changePassword: (
    oldPassword: string,
    newPassword: string,
  ) => Promise<{ success: boolean; error?: string }>;
}

const defaultSOSSettings: SOSSettings = {
  emergencyPassword: "1234", // Default password
  passwordProtected: true,
  autoResolveTime: 30,
  requirePasswordToCancel: true,
};

const SOSSettingsContext = createContext<SOSSettingsContextType | undefined>(
  undefined,
);

export function SOSSettingsProvider({ children }: { children: ReactNode }) {
  const { currentUser } = useAuth();
  const [sosSettings, setSOSSettings] =
    useState<SOSSettings>(defaultSOSSettings);

  useEffect(() => {
    loadSOSSettings();
  }, [currentUser]);

  const loadSOSSettings = async () => {
    if (!currentUser) return;

    try {
      // Try to load from localStorage first
      const saved = localStorage.getItem(`sos_settings_${currentUser.uid}`);
      if (saved) {
        const settings = JSON.parse(saved);
        setSOSSettings({ ...defaultSOSSettings, ...settings });
      }
    } catch (error) {
      console.error("Error loading SOS settings:", error);
    }
  };

  const updateSOSSettings = async (newSettings: Partial<SOSSettings>) => {
    if (!currentUser) return;

    try {
      const updatedSettings = { ...sosSettings, ...newSettings };
      setSOSSettings(updatedSettings);

      // Save to localStorage
      localStorage.setItem(
        `sos_settings_${currentUser.uid}`,
        JSON.stringify(updatedSettings),
      );
    } catch (error) {
      console.error("Error updating SOS settings:", error);
      throw error;
    }
  };

  const verifyPassword = (password: string): boolean => {
    return password === sosSettings.emergencyPassword;
  };

  const changePassword = async (
    oldPassword: string,
    newPassword: string,
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      if (!verifyPassword(oldPassword)) {
        return { success: false, error: "Current password is incorrect" };
      }

      if (newPassword.length < 4) {
        return {
          success: false,
          error: "Password must be at least 4 characters",
        };
      }

      await updateSOSSettings({ emergencyPassword: newPassword });
      return { success: true };
    } catch (error) {
      return { success: false, error: "Failed to change password" };
    }
  };

  return (
    <SOSSettingsContext.Provider
      value={{
        sosSettings,
        updateSOSSettings,
        verifyPassword,
        changePassword,
      }}
    >
      {children}
    </SOSSettingsContext.Provider>
  );
}

export function useSOSSettings() {
  const context = useContext(SOSSettingsContext);
  if (context === undefined) {
    throw new Error("useSOSSettings must be used within a SOSSettingsProvider");
  }
  return context;
}
