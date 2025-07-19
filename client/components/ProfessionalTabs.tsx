import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface TabItem {
  id: string;
  label: string;
  icon: React.ElementType;
  content: React.ReactNode;
  badge?: string | number;
}

interface ProfessionalTabsProps {
  tabs: TabItem[];
  defaultTab?: string;
  className?: string;
  onTabChange?: (tabId: string) => void;
}

export function ProfessionalTabs({
  tabs,
  defaultTab,
  className,
  onTabChange,
}: ProfessionalTabsProps) {
  const [activeTab, setActiveTab] = useState(defaultTab || tabs[0]?.id);

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    onTabChange?.(tabId);
  };

  const activeTabData = tabs.find((tab) => tab.id === activeTab);

  return (
    <div className={cn("w-full", className)}>
      {/* Tab Navigation */}
      <div className="relative">
        <div className="flex bg-gray-100/80 backdrop-blur-sm rounded-xl p-1 mb-4">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={cn(
                  "relative flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg",
                  "text-sm font-medium transition-all duration-200",
                  "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2",
                  isActive
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-50",
                )}
              >
                <Icon className="h-4 w-4" />
                <span className="hidden sm:inline">{tab.label}</span>
                <span className="sm:hidden">{tab.label.slice(0, 3)}</span>

                {tab.badge && (
                  <span className="ml-1 bg-blue-500 text-white text-xs px-1.5 py-0.5 rounded-full">
                    {tab.badge}
                  </span>
                )}

                {/* Active tab indicator */}
                {isActive && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute inset-0 bg-white rounded-lg shadow-sm -z-10"
                    initial={false}
                    transition={{
                      type: "spring",
                      duration: 0.4,
                      damping: 30,
                      stiffness: 300,
                    }}
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Content */}
      <div className="relative min-h-0">
        <AnimatePresence mode="wait">
          {activeTabData && (
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{
                duration: 0.2,
                ease: "easeInOut",
              }}
              className="w-full"
            >
              {activeTabData.content}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// Simplified version for smaller spaces
export function CompactProfessionalTabs({
  tabs,
  defaultTab,
  className,
  onTabChange,
}: ProfessionalTabsProps) {
  const [activeTab, setActiveTab] = useState(defaultTab || tabs[0]?.id);

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    onTabChange?.(tabId);
  };

  const activeTabData = tabs.find((tab) => tab.id === activeTab);

  return (
    <div className={cn("w-full", className)}>
      {/* Compact Tab Navigation */}
      <div className="flex bg-gray-50 rounded-lg p-0.5 mb-3">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={cn(
                "relative flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-md",
                "text-xs font-medium transition-all duration-200",
                isActive
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-600 hover:text-gray-900",
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              <span>{tab.label}</span>

              {tab.badge && (
                <span className="ml-1 bg-blue-500 text-white text-xs px-1 py-0.5 rounded-full leading-none">
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Compact Tab Content */}
      <div className="relative min-h-0">
        <AnimatePresence mode="wait">
          {activeTabData && (
            <motion.div
              key={activeTab}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="w-full"
            >
              {activeTabData.content}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// Hook for managing tab state
export function useProfessionalTabs(tabs: TabItem[], defaultTab?: string) {
  const [activeTab, setActiveTab] = useState(defaultTab || tabs[0]?.id);
  const [tabHistory, setTabHistory] = useState<string[]>([
    defaultTab || tabs[0]?.id,
  ]);

  const changeTab = (tabId: string) => {
    setActiveTab(tabId);
    setTabHistory((prev) => [...prev, tabId].slice(-10)); // Keep last 10 for history
  };

  const goBack = () => {
    if (tabHistory.length > 1) {
      const newHistory = tabHistory.slice(0, -1);
      setTabHistory(newHistory);
      setActiveTab(newHistory[newHistory.length - 1]);
    }
  };

  const getActiveTabData = () => tabs.find((tab) => tab.id === activeTab);

  return {
    activeTab,
    changeTab,
    goBack,
    getActiveTabData,
    canGoBack: tabHistory.length > 1,
  };
}
