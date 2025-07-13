// Toast Migration Helper
// This file provides backward compatibility for existing toast.* calls
// while gradually migrating to the enhanced notification system

import { notifications } from "@/services/enhancedNotificationService";

// Export a toast object that matches the old sonner API
export const toast = {
  success: (message: string, options?: any) => {
    return notifications.success({
      title: message,
      description: options?.description,
      duration: options?.duration,
      vibrate: true,
    });
  },

  error: (message: string, options?: any) => {
    return notifications.error({
      title: message,
      description: options?.description,
      duration: options?.duration,
      vibrate: true,
    });
  },

  warning: (message: string, options?: any) => {
    return notifications.warning({
      title: message,
      description: options?.description,
      duration: options?.duration,
      vibrate: true,
    });
  },

  info: (message: string, options?: any) => {
    return notifications.warning({
      title: message,
      description: options?.description,
      duration: options?.duration,
      vibrate: true,
    });
  },

  loading: (message: string, options?: any) => {
    return notifications.warning({
      title: message,
      description: options?.description,
      duration: options?.duration || Infinity,
    });
  },

  promise: (promise: Promise<any>, options: any) => {
    return notifications.promise(promise, options);
  },

  dismiss: (toastId?: string | number) => {
    notifications.dismiss(toastId);
  },
};

// For gradual migration, also export enhanced methods
export { notifications };
