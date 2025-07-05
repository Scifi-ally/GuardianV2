import { motion } from "framer-motion";
import { Route } from "lucide-react";
import { Button } from "@/components/ui/button";
import LocationAutocomplete from "@/components/LocationAutocomplete";

interface GuardianNavigationProps {
  fromLocation: string;
  setFromLocation: (value: string) => void;
  toLocation: string;
  setToLocation: (value: string) => void;
  onSearch: () => void;
  onUseCurrentLocation: () => void;
  location: { latitude: number; longitude: number } | null;
}

export function GuardianNavigation({
  fromLocation,
  setFromLocation,
  toLocation,
  setToLocation,
  onSearch,
  onUseCurrentLocation,
  location,
}: GuardianNavigationProps) {
  return (
    <motion.div
      className="relative z-50 bg-white/95 backdrop-blur-md border-b border-gray-200/30 shadow-md"
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
    >
      <div className="max-w-full mx-auto px-3 py-1.5">
        {/* Compact Navigation Container */}
        <motion.div
          className="bg-white rounded-md p-2 shadow-sm border border-gray-200/30"
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{
            type: "spring",
            stiffness: 300,
            damping: 25,
          }}
        >
          <div className="space-y-1.5">
            {/* From Input */}
            <div className="flex items-center gap-2">
              <motion.div
                className="w-2 h-2 bg-green-500 rounded-full shadow-sm flex-shrink-0"
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ repeat: Infinity, duration: 2 }}
              />
              <motion.div
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                className="flex-1"
              >
                <LocationAutocomplete
                  value={fromLocation}
                  onChange={setFromLocation}
                  placeholder="📍 From: Current location"
                  showCurrentLocationButton={true}
                  onCurrentLocation={() => {
                    console.log("📍 Using current location for FROM");
                    if (location) {
                      setFromLocation(
                        `${location.latitude.toFixed(6)}, ${location.longitude.toFixed(6)}`,
                      );
                    } else {
                      onUseCurrentLocation();
                    }
                  }}
                  className="w-full"
                />
              </motion.div>
            </div>

            {/* To Input */}
            <div className="flex items-center gap-2">
              <motion.div
                className="w-2 h-2 bg-blue-500 rounded-full shadow-sm flex-shrink-0"
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ repeat: Infinity, duration: 2, delay: 1 }}
              />
              <motion.div
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                className="flex-1"
              >
                <LocationAutocomplete
                  value={toLocation}
                  onChange={setToLocation}
                  placeholder="🎯 To: Destination"
                  onPlaceSelect={(place) => {
                    console.log("🎯 Destination selected:", place);
                  }}
                  className="w-full"
                />
              </motion.div>
            </div>

            {/* Search Button - Full width at bottom */}
            <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
              <Button
                onClick={onSearch}
                className="w-full h-9 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-md shadow-sm font-medium transition-all duration-200 text-sm"
                disabled={!fromLocation || !toLocation}
              >
                <Route className="h-4 w-4 mr-2" />
                Find Route
              </Button>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}

export default GuardianNavigation;
