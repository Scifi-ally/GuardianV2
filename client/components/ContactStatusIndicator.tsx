import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle,
  AlertCircle,
  XCircle,
  Clock,
  Wifi,
  WifiOff,
  Phone,
  Mail,
  MessageSquare,
} from "lucide-react";
import { emergencyContactConnectionService } from "@/services/emergencyContactConnectionService";

interface ContactStatusIndicatorProps {
  contactId: string;
  className?: string;
}

export function ContactStatusIndicator({
  contactId,
  className,
}: ContactStatusIndicatorProps) {
  const [connectionStatus, setConnectionStatus] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkConnectionStatus = () => {
      const status =
        emergencyContactConnectionService.getConnectionStatus(contactId);
      setConnectionStatus(status);
      setIsLoading(false);
    };

    // Initial check
    checkConnectionStatus();

    // Listen for connection status changes
    const handleStatusChange = (status: any) => {
      if (status.contactId === contactId) {
        setConnectionStatus(status);
      }
    };

    emergencyContactConnectionService.on(
      "connectionStatusChanged",
      handleStatusChange,
    );

    // Periodic checks
    const interval = setInterval(checkConnectionStatus, 60000);

    return () => {
      emergencyContactConnectionService.off(
        "connectionStatusChanged",
        handleStatusChange,
      );
      clearInterval(interval);
    };
  }, [contactId]);

  if (isLoading) {
    return (
      <div className={cn("flex items-center gap-1.5", className)}>
        <div className="w-2 h-2 rounded-full bg-gray-400 animate-pulse" />
        <span className="text-xs text-muted-foreground">Checking...</span>
      </div>
    );
  }

  if (!connectionStatus) {
    return (
      <div className={cn("flex items-center gap-1.5", className)}>
        <div className="w-2 h-2 rounded-full bg-gray-400" />
        <span className="text-xs text-muted-foreground">Unknown</span>
      </div>
    );
  }

  const getStatusColor = () => {
    if (connectionStatus.isConnected) {
      return "bg-green-500";
    } else if (connectionStatus.error) {
      return "bg-red-500";
    } else {
      return "bg-gray-400";
    }
  };

  const getMethodIcon = () => {
    switch (connectionStatus.method) {
      case "push":
        return <Wifi className="h-3 w-3" />;
      case "email":
        return <Mail className="h-3 w-3" />;
      case "sms":
        return <MessageSquare className="h-3 w-3" />;
      case "call":
        return <Phone className="h-3 w-3" />;
      default:
        return <WifiOff className="h-3 w-3" />;
    }
  };

  const getStatusText = () => {
    if (connectionStatus.isConnected) {
      return connectionStatus.method.toUpperCase();
    } else if (connectionStatus.error) {
      return "Error";
    } else {
      return "Offline";
    }
  };

  // Helper function kept for reference
  const getRelativeTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 1) return "just now";
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  return (
    <div className={cn("flex items-center gap-1.5", className)}>
      <motion.div
        key={connectionStatus.isConnected ? "connected" : "disconnected"}
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        className={cn(
          "w-2 h-2 rounded-full transition-colors",
          getStatusColor(),
          connectionStatus.isConnected && "animate-pulse",
        )}
      />
      <motion.div
        key={getStatusText()}
        initial={{ opacity: 0, x: -5 }}
        animate={{ opacity: 1, x: 0 }}
        className="flex items-center gap-1"
        title={
          connectionStatus.error || `Connected via ${connectionStatus.method}`
        }
      >
        <span className="text-xs text-muted-foreground">{getStatusText()}</span>
      </motion.div>
    </div>
  );
}

export default ContactStatusIndicator;
