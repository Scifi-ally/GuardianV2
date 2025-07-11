#!/usr/bin/env python3

import re

# Read the Index.tsx file
with open('client/pages/Index.tsx', 'r') as f:
    content = f.read()

# Remove the CustomCheckbox import
content = re.sub(r'import { CustomCheckbox } from "@/components/ui/custom-checkbox";\n', '', content)

# Fix the Traffic checkbox
content = re.sub(
    r'<CustomCheckbox\s+checked={routeSettings\.showTraffic}\s+onChange={\(checked\) =>\s+setRouteSettings\(\(prev\) => \({\s+\.\.\.prev,\s+showTraffic: checked,\s+}\)\)\s+}\s+size="sm"\s+/>',
    '<input\n                        type="checkbox"\n                        checked={routeSettings.showTraffic}\n                        onChange={(e) =>\n                          setRouteSettings((prev) => ({\n                            ...prev,\n                            showTraffic: e.target.checked,\n                          }))\n                        }\n                        className="w-4 h-4 accent-blue-600 cursor-pointer"\n                      />',
    content,
    flags=re.MULTILINE | re.DOTALL
)

# Fix the Safe Zones checkbox
content = re.sub(
    r'<CustomCheckbox\s+checked={routeSettings\.showSafeZones}\s+onChange={\(checked\) =>\s+setRouteSettings\(\(prev\) => \({\s+\.\.\.prev,\s+showSafeZones: checked,\s+}\)\)\s+}\s+size="sm"\s+/>',
    '<input\n                        type="checkbox"\n                        checked={routeSettings.showSafeZones}\n                        onChange={(e) =>\n                          setRouteSettings((prev) => ({\n                            ...prev,\n                            showSafeZones: e.target.checked,\n                          }))\n                        }\n                        className="w-4 h-4 accent-blue-600 cursor-pointer"\n                      />',
    content,
    flags=re.MULTILINE | re.DOTALL
)

# Fix the Emergency Services checkbox
content = re.sub(
    r'<CustomCheckbox\s+checked={routeSettings\.showEmergencyServices}\s+onChange={\(checked\) =>\s+setRouteSettings\(\(prev\) => \({\s+\.\.\.prev,\s+showEmergencyServices: checked,\s+}\)\)\s+}\s+size="sm"\s+/>',
    '<input\n                        type="checkbox"\n                        checked={routeSettings.showEmergencyServices}\n                        onChange={(e) =>\n                          setRouteSettings((prev) => ({\n                            ...prev,\n                            showEmergencyServices: e.target.checked,\n                          }))\n                        }\n                        className="w-4 h-4 accent-blue-600 cursor-pointer"\n                      />',
    content,
    flags=re.MULTILINE | re.DOTALL
)

# Fix the Debug Console checkbox
content = re.sub(
    r'<CustomCheckbox\s+checked={routeSettings\.showDebug}\s+onChange={\(checked\) =>\s+setRouteSettings\(\(prev\) => \({\s+\.\.\.prev,\s+showDebug: checked,\s+}\)\)\s+}\s+size="sm"\s+/>',
    '<input\n                        type="checkbox"\n                        checked={routeSettings.showDebug}\n                        onChange={(e) =>\n                          setRouteSettings((prev) => ({\n                            ...prev,\n                            showDebug: e.target.checked,\n                          }))\n                        }\n                        className="w-4 h-4 accent-blue-600 cursor-pointer"\n                      />',
    content,
    flags=re.MULTILINE | re.DOTALL
)

# Remove the zoom slider section completely
zoom_slider_pattern = r'<motion\.div\s+className="flex items-center justify-between p-2 bg-muted/20 rounded border transition-all duration-200 hover:bg-muted/30"\s+whileHover={{ scale: 1\.01 }}\s+whileTap={{ scale: 0\.99 }}\s+>\s+<div>\s+<p className="text-sm font-medium">Zoom Level</p>\s+<p className="text-xs text-muted-foreground">\s+{routeSettings\.zoomLevel}\s+</p>\s+</div>\s+<input\s+type="range"\s+min="10"\s+max="20"\s+value={routeSettings\.zoomLevel}\s+onChange={\(e\) =>\s+setRouteSettings\(\(prev\) => \({\s+\.\.\.prev,\s+zoomLevel: parseInt\(e\.target\.value\),\s+}\)\)\s+}\s+className="w-16 h-2"\s+/>\s+</motion\.div>'

content = re.sub(zoom_slider_pattern, '', content, flags=re.MULTILINE | re.DOTALL)

# Write the fixed content back
with open('client/pages/Index.tsx', 'w') as f:
    f.write(content)

print("Fixed Index.tsx - replaced CustomCheckbox components with standard checkboxes and removed zoom slider")
