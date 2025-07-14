#!/bin/bash

# Guardian Safety - Mobile Build Script
# Builds the app for iOS and Android deployment

echo "🛡️ Guardian Safety - Mobile Build Script"
echo "========================================="

# Check if we're in the right directory
if [ ! -f "capacitor.config.ts" ]; then
  echo "❌ Error: capacitor.config.ts not found. Please run this script from the project root."
  exit 1
fi

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
  echo "📦 Installing dependencies..."
  npm install
fi

# Build the web app
echo "🏗️ Building web application..."
npm run build

if [ $? -ne 0 ]; then
  echo "❌ Web build failed!"
  exit 1
fi

# Sync with Capacitor
echo "🔄 Syncing with Capacitor..."
npx cap sync

if [ $? -ne 0 ]; then
  echo "❌ Capacitor sync failed!"
  exit 1
fi

# Copy icons and splash screens
echo "🎨 Copying mobile assets..."
mkdir -p android/app/src/main/res/drawable
mkdir -p ios/App/App/Assets.xcassets/AppIcon.appiconset
mkdir -p ios/App/App/Assets.xcassets/Splash.imageset

# Check what platforms to build
echo "📱 Available build options:"
echo "1. Android"
echo "2. iOS"
echo "3. Both"
read -p "Select build option (1-3): " choice

case $choice in
  1)
    echo "🤖 Building for Android..."
    npx cap build android
    ;;
  2)
    echo "🍎 Building for iOS..."
    npx cap build ios
    ;;
  3)
    echo "📱 Building for both platforms..."
    npx cap build android
    npx cap build ios
    ;;
  *)
    echo "❌ Invalid option. Building for both platforms..."
    npx cap build android
    npx cap build ios
    ;;
esac

echo "✅ Mobile build complete!"
echo ""
echo "📂 Build artifacts:"
echo "   - Web: ./dist/spa/"
echo "   - Android: ./android/"
echo "   - iOS: ./ios/"
echo ""
echo "🚀 Next steps:"
echo "   - Android: Open ./android/ in Android Studio"
echo "   - iOS: Open ./ios/App.xcworkspace in Xcode"
echo ""
echo "🛡️ Guardian Safety is ready for mobile deployment!"
