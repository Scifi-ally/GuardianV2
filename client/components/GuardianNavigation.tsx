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
      className="relative z-20 bg-background/95 backdrop-blur-md border-b border-border/20 shadow-lg"
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
    >
      <div className="container mx-auto px-4 py-4">
        {/* Guardian Branding */}
        <motion.div
          className="flex items-center justify-center mb-3"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 400 }}
        >
          <span className="text-black font-bold text-sm tracking-wide">
            GUARDIAN
          </span>
        </motion.div>

        {/* Enhanced Navigation Container */}
        <motion.div
          className="bg-white/95 rounded-2xl p-4 shadow-xl border border-gray-200/50"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{
            delay: 0.3,
            type: "spring",
            stiffness: 300,
            damping: 25,
          }}
        >
          <div className="flex items-center gap-3">
            {/* Visual Connection Line */}
            <div className="flex flex-col items-center">
              <motion.div
                className="w-3 h-3 bg-green-500 rounded-full shadow-lg"
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ repeat: Infinity, duration: 2 }}
              />
              <div className="w-0.5 h-12 bg-gradient-to-b from-green-500 to-blue-500 my-1"></div>
              <motion.div
                className="w-3 h-3 bg-blue-500 rounded-full shadow-lg"
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ repeat: Infinity, duration: 2, delay: 1 }}
              />
            </div>

            <div className="flex-1 space-y-3">
              {/* From Input */}
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
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

              {/* To Input */}
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
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

            {/* Search Button */}
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex-shrink-0"
            >
              <Button
                onClick={onSearch}
                className="h-12 px-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl shadow-lg font-medium transition-all duration-300"
                disabled={!fromLocation || !toLocation}
              >
                <Route className="h-4 w-4 mr-2" />
                Go
              </Button>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}

export default GuardianNavigation;
