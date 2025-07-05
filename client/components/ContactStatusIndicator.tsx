import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface ContactStatusIndicatorProps {
  contactId: string;
  className?: string;
}

export function ContactStatusIndicator({
  contactId,
  className,
}: ContactStatusIndicatorProps) {
  const [status, setStatus] = useState<"online" | "offline" | "away">(
    "offline",
  );
  const [lastSeen, setLastSeen] = useState<Date | null>(null);

  useEffect(() => {
    // Simulate dynamic status updates
    const updateStatus = () => {
      const statuses: ("online" | "offline" | "away")[] = [
        "online",
        "offline",
        "away",
      ];
      const randomStatus =
        statuses[Math.floor(Math.random() * statuses.length)];
      setStatus(randomStatus);

      if (randomStatus !== "online") {
        setLastSeen(new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000)); // Random time within last 24h
      }
    };

    // Initial update
    updateStatus();

    // Update every 10-30 seconds for dynamic effect
    const interval = setInterval(updateStatus, 10000 + Math.random() * 20000);

    return () => clearInterval(interval);
  }, [contactId]);

  const getStatusColor = () => {
    switch (status) {
      case "online":
        return "bg-green-500";
      case "away":
        return "bg-yellow-500";
      case "offline":
        return "bg-gray-400";
    }
  };

  const getStatusText = () => {
    switch (status) {
      case "online":
        return "Online";
      case "away":
        return "Away";
      case "offline":
        return lastSeen ? `Last seen ${getRelativeTime(lastSeen)}` : "Offline";
    }
  };

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
        key={status}
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        className={cn(
          "w-2 h-2 rounded-full transition-colors",
          getStatusColor(),
          status === "online" && "animate-pulse",
        )}
      />
      <motion.span
        key={getStatusText()}
        initial={{ opacity: 0, x: -5 }}
        animate={{ opacity: 1, x: 0 }}
        className="text-xs text-muted-foreground"
      >
        {getStatusText()}
      </motion.span>
    </div>
  );
}

export default ContactStatusIndicator;
