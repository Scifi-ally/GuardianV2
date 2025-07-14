# Emergency Safety App - Mobile Setup

This guide will help you build and run the Emergency Safety App as a native mobile application using Capacitor.

## ✅ Fixed Features

### Camera & QR Scanner

- **Real QR Code Scanning**: Uses `qr-scanner` library for accurate QR detection
- **Mobile Camera Integration**: Proper camera permissions and native camera access
- **Live Camera Feed**: Shows actual camera view (not just placeholder)
- **Mobile Optimized**: Works on both web and native mobile platforms

## 🛠️ Installation Requirements

### All Platforms

- Node.js 16+
- npm or yarn

### Android Development

- [Android Studio](https://developer.android.com/studio)
- Android SDK (API level 21 or higher)
- Java 11+

### iOS Development (macOS only)

- [Xcode 12+](https://developer.apple.com/xcode/)
- iOS SDK 13.0+
- CocoaPods

## 📱 Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Build for Mobile

```bash
npm run build:mobile
```

### 3. Run on Device/Simulator

#### Android

```bash
# Open Android Studio
npm run mobile:open:android

# Or run directly on connected device
npm run android:dev
```

#### iOS (macOS only)

```bash
# Open Xcode
npm run mobile:open:ios

# Or run directly on connected device/simulator
npm run ios:dev
```

## 🔧 Development Workflow

### Making Changes

1. Edit your code in `client/` directory
2. Run `npm run build:mobile` to rebuild
3. Use `npm run mobile:sync` for quick sync without full rebuild

### Available Scripts

- `npm run build:mobile` - Build web app and sync with mobile
- `npm run android:dev` - Build and run on Android
- `npm run ios:dev` - Build and run on iOS
- `npm run mobile:sync` - Sync changes to mobile platforms
- `npm run mobile:open:android` - Open Android Studio
- `npm run mobile:open:ios` - Open Xcode

## 📋 Camera Permissions

The app automatically handles camera permissions:

### Android

- Camera permission for QR scanning
- External storage permission (if needed)

### iOS

- Camera usage permission
- Photo library access (if needed)

### Web Browser

- Camera access through getUserMedia API
- Works in Chrome, Firefox, Safari, Edge

## 🔍 Features

### QR Scanner

- **Real-time scanning**: Live camera feed with QR detection
- **Mobile optimized**: Uses environment camera (back camera)
- **Visual feedback**: Scan region highlighting and code outline
- **Error handling**: Proper permission and error management
- **Cross-platform**: Works on web and native mobile

### Emergency Features

- Location-based safety scoring
- Emergency contact management
- Real-time route optimization
- Offline emergency functionality

## 🐛 Troubleshooting

### Camera Not Working

1. **Check permissions**: Ensure camera permissions are granted
2. **Restart app**: Close and reopen the application
3. **Check device**: Verify device has a working camera
4. **Browser issues**: Try different browser for web version

### Build Issues

1. **Clean build**: Delete `node_modules` and reinstall
2. **Capacitor sync**: Run `npm run mobile:sync`
3. **Native tools**: Ensure Android Studio/Xcode are properly installed

### Android Build Errors

1. Check Android SDK is installed
2. Verify JAVA_HOME environment variable
3. Open Android Studio and sync project

### iOS Build Errors (macOS)

1. Install CocoaPods: `sudo gem install cocoapods`
2. Run `pod install` in `ios/App` directory
3. Open Xcode and clean build folder

## 📚 Additional Resources

- [Capacitor Documentation](https://capacitorjs.com/docs)
- [QR Scanner Library](https://github.com/nimiq/qr-scanner)
- [Android Development](https://developer.android.com/)
- [iOS Development](https://developer.apple.com/ios/)

## 🚀 Deployment

### Android

1. Build release APK in Android Studio
2. Sign with your keystore
3. Upload to Google Play Store

### iOS

1. Archive app in Xcode
2. Submit to App Store Connect
3. Review and publish through App Store

## ✨ What's Fixed

- ✅ Camera shows live feed (not placeholder)
- ✅ QR codes are actually detected and scanned
- ✅ Mobile camera permissions handled properly
- ✅ Cross-platform compatibility (web + mobile)
- ✅ Capacitor integration for native app builds
- ✅ Build scripts and development workflow
- ✅ Error handling and user feedback

The camera and QR scanner now work properly with real detection capabilities!
