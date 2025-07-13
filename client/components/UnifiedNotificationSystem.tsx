import { useEffect } from "react";
import { Toaster } from "@/components/ui/enhanced-toast";
import { useNotificationGestures } from "@/hooks/useNotificationGestures";
import { notifications } from "@/services/enhancedNotificationService";
import { useAuth } from "@/contexts/AuthContext";

export function UnifiedNotificationSystem() {
  const { userProfile } = useAuth();

  // Handle emergency gesture (shake to call for help)
  const handleEmergencyGesture = () => {
    if (!userProfile?.emergencyContacts?.length) {
      notifications.error({
        title: "No Emergency Contacts",
        description: "Please add emergency contacts in settings",
        action: {
          label: "Add Contacts",
          onClick: () => (window.location.href = "/contacts"),
        },
      });
      return;
    }

    notifications.emergency({
      title: "Emergency Gesture Detected",
      description: "Shake detected - activating emergency protocols",
      primaryAction: {
        label: "Call 911",
        onClick: () => {
          window.open("tel:911");
          notifications.info({
            title: "Calling 911",
            description: "Emergency services contacted",
          });
        },
      },
      secondaryAction: {
        label: "Cancel",
        onClick: () => {
          notifications.info({
            title: "Emergency Cancelled",
            description: "Emergency protocols cancelled",
          });
        },
      },
    });

    // Auto-share location with emergency contacts
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          const message = `🚨 EMERGENCY: I need help! My location: https://maps.google.com/?q=${latitude},${longitude}`;

          // Share with emergency contacts
          userProfile.emergencyContacts?.forEach((contact) => {
            if (contact.phone) {
              // Use SMS if available
              window.open(
                `sms:${contact.phone}?body=${encodeURIComponent(message)}`,
              );
            }
          });

          notifications.info({
            title: "Location Shared",
            description: `Emergency location sent to ${userProfile.emergencyContacts?.length} contacts`,
          });
        },
        () => {
          notifications.warning({
            title: "Location Unavailable",
            description: "Could not get current location for emergency sharing",
          });
        },
      );
    }
  };

  // Handle dismiss gesture
  const handleDismissGesture = () => {
    // Provide haptic feedback if available
    if ("vibrate" in navigator) {
      navigator.vibrate(50);
    }
  };

  // Initialize gesture support
  useNotificationGestures({
    enableSwipeUp: true,
    enableShakeToCallHelp: true,
    enableDoubleTapDismiss: true,
    onEmergencyGesture: handleEmergencyGesture,
    onDismissGesture: handleDismissGesture,
  });

  // Add custom CSS for enhanced gesture interactions
  useEffect(() => {
    const style = document.createElement("style");
    style.textContent = `
      /* Enhanced toast gesture styles */
      [data-sonner-toast] {
        transform-origin: center;
        will-change: transform;
      }
      
      [data-sonner-toast]:hover {
        transform: translateY(-2px);
        box-shadow: 0 8px 20px rgba(0, 0, 0, 0.2);
      }
      
      [data-sonner-toast]:active {
        transform: scale(0.98);
      }
      
      /* Swipe indicator */
      [data-sonner-toast]::before {
        content: '';
        position: absolute;
        top: 8px;
        left: 50%;
        transform: translateX(-50%);
        width: 30px;
        height: 3px;
        background: hsl(var(--muted-foreground));
        border-radius: 2px;
        opacity: 0.3;
        transition: opacity 0.2s ease;
      }
      
      [data-sonner-toast]:hover::before {
        opacity: 0.6;
      }
      
      /* Emergency toast special styling */
      [data-sonner-toast][data-type="error"] {
        animation: emergency-pulse 1.5s ease-in-out infinite;
      }
      
      @keyframes emergency-pulse {
        0%, 100% {
          transform: scale(1);
          box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.4);
        }
        50% {
          transform: scale(1.02);
          box-shadow: 0 0 0 8px rgba(239, 68, 68, 0);
        }
      }
      
      /* Accessible focus indicators for emergency situations */
      [data-sonner-toast]:focus-visible {
        outline: 3px solid #ff6b35 !important;
        outline-offset: 2px !important;
      }
      
      /* Mobile-optimized touch targets */
      @media (max-width: 768px) {
        [data-sonner-toast] {
          min-height: 60px;
          padding: 16px 20px;
          margin: 8px;
        }
        
        [data-sonner-toast] button {
          min-height: 44px;
          min-width: 44px;
          padding: 8px 16px;
        }
      }
    `;
    document.head.appendChild(style);

    return () => {
      document.head.removeChild(style);
    };
  }, []);

  return <Toaster />;
}
