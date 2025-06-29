import { ReactNode, useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface SlidingPanelProps {
  children: ReactNode;
  title: string;
  isOpen: boolean;
  onClose: () => void;
  direction?: "left" | "right" | "bottom";
  size?: "sm" | "md" | "lg" | "full";
  className?: string;
}

export function SlidingPanel({
  children,
  title,
  isOpen,
  onClose,
  direction = "right",
  size = "md",
  className,
}: SlidingPanelProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
    } else {
      const timer = setTimeout(() => setIsVisible(false), 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  const sizeClasses = {
    sm: "w-80",
    md: "w-96",
    lg: "w-[32rem]",
    full: "w-full",
  };

  const directionClasses = {
    left: {
      panel: "left-0 top-0 h-full",
      transform: isOpen ? "translate-x-0" : "-translate-x-full",
    },
    right: {
      panel: "right-0 top-0 h-full",
      transform: isOpen ? "translate-x-0" : "translate-x-full",
    },
    bottom: {
      panel: "bottom-0 left-0 right-0 h-1/2 w-full",
      transform: isOpen ? "translate-y-0" : "translate-y-full",
    },
  };

  if (!isVisible) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className={cn(
          "fixed inset-0 bg-black/50 backdrop-blur-sm z-40 transition-opacity duration-300",
          isOpen ? "opacity-100" : "opacity-0",
        )}
        onClick={onClose}
      />

      {/* Panel */}
      <div
        className={cn(
          "fixed z-50 bg-background border-l shadow-2xl transition-transform duration-300 ease-out",
          directionClasses[direction].panel,
          direction !== "bottom" && sizeClasses[size],
          directionClasses[direction].transform,
          className,
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">{title}</h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-4">{children}</div>
      </div>
    </>
  );
}

interface PanelContainerProps {
  children: ReactNode;
  className?: string;
}

export function PanelContainer({ children, className }: PanelContainerProps) {
  return (
    <div className={cn("h-screen overflow-hidden relative", className)}>
      {children}
    </div>
  );
}

interface TabSwitcherProps {
  tabs: { id: string; label: string; icon?: React.ElementType }[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
  className?: string;
}

export function TabSwitcher({
  tabs,
  activeTab,
  onTabChange,
  className,
}: TabSwitcherProps) {
  return (
    <div
      className={cn(
        "flex bg-muted rounded-lg p-1 space-x-1 overflow-x-auto",
        className,
      )}
    >
      {tabs.map((tab) => {
        const Icon = tab.icon;
        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={cn(
              "flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 whitespace-nowrap",
              activeTab === tab.id
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground hover:bg-background/50",
            )}
          >
            {Icon && <Icon className="h-4 w-4" />}
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
