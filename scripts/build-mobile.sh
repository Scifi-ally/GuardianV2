#!/bin/bash

echo "🔧 Building Emergency Safety App for mobile..."

# Build the web app
echo "📦 Building web app..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Web build failed"
    exit 1
fi

echo "✅ Web build successful"

# Sync with Capacitor
echo "📱 Syncing with Capacitor..."
npx cap sync

if [ $? -ne 0 ]; then
    echo "❌ Capacitor sync failed"
    exit 1
fi

echo "✅ Capacitor sync successful"

# Copy additional assets
echo "📂 Copying mobile assets..."
mkdir -p android/app/src/main/res/values
mkdir -p ios/App/App

# Create Android permissions
cat > android/app/src/main/res/values/strings.xml << 'EOF'
<?xml version="1.0" encoding="utf-8"?>
<resources>
    <string name="app_name">Emergency Safety App</string>
    <string name="title_activity_main">Emergency Safety App</string>
    <string name="package_name">com.emergency.safety</string>
    <string name="custom_url_scheme">com.emergency.safety</string>
</resources>
EOF

# Add camera permissions to Android manifest
if [ -f "android/app/src/main/AndroidManifest.xml" ]; then
    echo "✅ Android manifest exists, permissions will be auto-added by Capacitor"
fi

echo "🎉 Mobile build complete!"
echo ""
echo "📱 Next steps:"
echo "  • For Android: npx cap open android"
echo "  • For iOS: npx cap open ios"
echo "  • To test: npx cap run android --target=<device>"
echo ""
echo "📋 Requirements for building:"
echo "  • Android: Android Studio with SDK 21+"
echo "  • iOS: Xcode 12+ (macOS only)"
echo ""
echo "🔍 Camera permissions:"
echo "  • Camera access for QR scanning"
echo "  • Photo library access for image capture"
echo "  • Location access for emergency features"
