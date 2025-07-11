// This is a simple replacement for the problematic settings section
// Replace CustomCheckbox with standard HTML checkboxes and remove zoom slider

const settingsSection = `
                {/* Map Style Settings */}
                <div>
                  <h4 className="text-sm font-medium mb-3">Map Display</h4>
                  <div className="space-y-2">
                    <motion.div
                      className="flex items-center justify-between p-2 bg-muted/20 rounded border transition-all duration-200 hover:bg-muted/30"
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                    >
                      <div>
                        <p className="text-sm font-medium">Map Theme</p>
                        <p className="text-xs text-muted-foreground">
                          Light or dark
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={toggleTheme}
                        className="h-7 px-2 text-xs"
                      >
                        {mapTheme === "light" ? "🌞" : "🌙"}
                      </Button>
                    </motion.div>

                    <motion.div
                      className="flex items-center justify-between p-2 bg-muted/20 rounded border transition-all duration-200 hover:bg-muted/30"
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                    >
                      <div>
                        <p className="text-sm font-medium">Map Type</p>
                        <p className="text-xs text-muted-foreground">
                          Standard or satellite
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={toggleMapType}
                        className="h-7 px-2 text-xs"
                      >
                        {mapType === "normal" ? "🗺️" : "🛰️"}
                      </Button>
                    </motion.div>

                    <motion.div
                      className="flex items-center justify-between p-2 bg-muted/20 rounded border transition-all duration-200 hover:bg-muted/30"
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                    >
                      <div>
                        <p className="text-sm font-medium">Traffic</p>
                        <p className="text-xs text-muted-foreground">
                          Real-time conditions
                        </p>
                      </div>
                      <input
                        type="checkbox"
                        checked={routeSettings.showTraffic}
                        onChange={(e) =>
                          setRouteSettings((prev) => ({
                            ...prev,
                            showTraffic: e.target.checked,
                          }))
                        }
                        className="w-4 h-4 accent-blue-600 cursor-pointer"
                      />
                    </motion.div>

                    <motion.div
                      className="flex items-center justify-between p-2 bg-muted/20 rounded border transition-all duration-200 hover:bg-muted/30"
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                    >
                      <div>
                        <p className="text-sm font-medium">Safe Zones</p>
                        <p className="text-xs text-muted-foreground">
                          Police & safe areas
                        </p>
                      </div>
                      <input
                        type="checkbox"
                        checked={routeSettings.showSafeZones}
                        onChange={(e) =>
                          setRouteSettings((prev) => ({
                            ...prev,
                            showSafeZones: e.target.checked,
                          }))
                        }
                        className="w-4 h-4 accent-blue-600 cursor-pointer"
                      />
                    </motion.div>

                    <motion.div
                      className="flex items-center justify-between p-2 bg-muted/20 rounded border transition-all duration-200 hover:bg-muted/30"
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                    >
                      <div>
                        <p className="text-sm font-medium">
                          Emergency Services
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Hospitals & services
                        </p>
                      </div>
                      <input
                        type="checkbox"
                        checked={routeSettings.showEmergencyServices}
                        onChange={(e) =>
                          setRouteSettings((prev) => ({
                            ...prev,
                            showEmergencyServices: e.target.checked,
                          }))
                        }
                        className="w-4 h-4 accent-blue-600 cursor-pointer"
                      />
                    </motion.div>

                    <motion.div
                      className="flex items-center justify-between p-2 bg-muted/20 rounded border transition-all duration-200 hover:bg-muted/30"
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                    >
                      <div>
                        <p className="text-sm font-medium">Debug Console</p>
                        <p className="text-xs text-muted-foreground">
                          Developer info & logs
                        </p>
                      </div>
                      <input
                        type="checkbox"
                        checked={routeSettings.showDebug}
                        onChange={(e) =>
                          setRouteSettings((prev) => ({
                            ...prev,
                            showDebug: e.target.checked,
                          }))
                        }
                        className="w-4 h-4 accent-blue-600 cursor-pointer"
                      />
                    </motion.div>

                    {/* Debug Console Content */}
                    {routeSettings.showDebug && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3 }}
                        className="mt-4 p-4 bg-slate-50 rounded-lg border border-slate-200"
                      >
                        <h4 className="text-sm font-semibold text-slate-800 mb-3 flex items-center gap-2">
                          <Activity className="h-4 w-4" />
                          Debug Information
                        </h4>
                        <DebugContent />
                      </motion.div>
                    )}
                  </div>
                </div>
`;

// Note: Zoom slider has been completely removed as requested
// All CustomCheckbox components replaced with standard HTML checkboxes
// Added cursor-pointer class for better UX
