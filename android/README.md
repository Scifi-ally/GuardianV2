# Guardian Safety - Android App

This is the complete Android version of the Guardian Safety app, converted from React to Kotlin with Jetpack Compose.

## 🚀 Features

- **Emergency SOS System** - Press & hold SOS button to alert contacts
- **Real-time Location Tracking** - Automatic location sharing during emergencies
- **Emergency Contact Network** - Add trusted contacts with priority levels
- **Guardian Key System** - Unique keys for adding contacts to safety network
- **Interactive Safety Tutorial** - Complete onboarding experience
- **Firebase Integration** - Real-time sync with existing web app
- **Background Services** - Location tracking and push notifications
- **Modern UI** - Built with Jetpack Compose and Material 3

## 📋 Prerequisites

- Android Studio Flamingo (2022.2.1) or later
- Kotlin 1.9.10+
- Android SDK 34
- Minimum SDK 24 (Android 7.0)
- Firebase project with Authentication and Firestore enabled

## 🛠️ Setup Instructions

### 1. Clone and Open Project

```bash
# Navigate to the android directory
cd android
```

Open the `android` folder in Android Studio.

### 2. Firebase Configuration

#### Get google-services.json:

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your Guardian project (or create new one)
3. Add Android app with package name: `com.guardian.safety`
4. Download `google-services.json`
5. Place it in `android/app/` directory

#### Configure Firebase:

- Enable **Authentication** (Email/Password)
- Enable **Firestore Database**
- Enable **Cloud Messaging** (for push notifications)
- Set Firestore security rules to match your existing web app

### 3. Android App Icons

You need to add these drawable resources in `app/src/main/res/drawable/`:

```xml
<!-- ic_shield.xml -->
<vector xmlns:android="http://schemas.android.com/apk/res/android"
    android:width="24dp"
    android:height="24dp"
    android:viewportWidth="24"
    android:viewportHeight="24"
    android:tint="?attr/colorOnSurface">
  <path
      android:fillColor="@android:color/white"
      android:pathData="M12,1L3,5V11C3,16.55 6.84,21.74 12,23C17.16,21.74 21,16.55 21,11V5L12,1M12,7C13.4,7 14.8,8.6 14.8,10.5V11.5C15.4,11.5 16,12.4 16,13V16C16,16.6 15.6,17 15,17H9C8.4,17 8,16.6 8,16V13C8,12.4 8.4,11.5 9,11.5V10.5C9,8.6 10.6,7 12,7M12,8.2C11.2,8.2 10.2,8.7 10.2,10.5V11.5H13.8V10.5C13.8,8.7 12.8,8.2 12,8.2Z"/>
</vector>

<!-- Add similar vectors for other icons: ic_location, ic_emergency, ic_check, ic_navigation, ic_people, ic_error, ic_notification -->
```

### 4. Build Project

```bash
# Clean and build
./gradlew clean
./gradlew build

# Or use Android Studio's Build menu
```

### 5. Run on Device/Emulator

1. Connect Android device or start emulator
2. Click "Run" in Android Studio
3. Select your device
4. App will install and launch

## 📱 How to Deploy

### Development Build

```bash
# Generate debug APK
./gradlew assembleDebug

# APK location: app/build/outputs/apk/debug/app-debug.apk
```

### Production Build

```bash
# Generate release APK (unsigned)
./gradlew assembleRelease

# Generate AAB for Play Store
./gradlew bundleRelease
```

### Signing for Production

1. **Create Keystore:**

```bash
keytool -genkey -v -keystore guardian-release-key.keystore -alias guardian -keyalg RSA -keysize 2048 -validity 10000
```

2. **Add to app/build.gradle.kts:**

```kotlin
android {
    signingConfigs {
        create("release") {
            storeFile = file("guardian-release-key.keystore")
            storePassword = "your_store_password"
            keyAlias = "guardian"
            keyPassword = "your_key_password"
        }
    }
    buildTypes {
        release {
            signingConfig = signingConfigs.getByName("release")
            // ... other config
        }
    }
}
```

3. **Build signed APK:**

```bash
./gradlew assembleRelease
```

### Google Play Store Deployment

1. **Prepare App Bundle:**

```bash
./gradlew bundleRelease
```

2. **Upload to Play Console:**
   - Go to [Google Play Console](https://play.google.com/console)
   - Create new app or select existing
   - Upload `app-release.aab` from `app/build/outputs/bundle/release/`
   - Fill in store listing details
   - Complete review process

### Alternative Distribution Methods

#### 1. Direct APK Distribution

- Share the signed APK file directly
- Users need to enable "Unknown Sources" in Android settings

#### 2. Firebase App Distribution

```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login and setup
firebase login
firebase projects:list

# Upload APK for testing
firebase appdistribution:distribute app-release.apk \
  --project your-project-id \
  --app your-android-app-id \
  --testers "tester1@example.com,tester2@example.com"
```

#### 3. Amazon Appstore

- Similar to Play Store but upload to Amazon Developer Console
- Supports APK files directly

## 🔧 Project Structure

```
android/
├── app/
│   ├── src/main/kotlin/com/guardian/safety/
│   │   ├── data/
│   │   │   ├── models/          # Data classes (User, SOSAlert, etc.)
│   │   │   └── repositories/    # Firebase repositories
│   │   ├── di/                  # Dependency injection
│   │   ├── presentation/
│   │   │   ├── components/      # Reusable UI components
│   │   │   ├── screens/         # All app screens
│   │   │   └── viewmodels/      # Business logic
│   │   ├── services/            # Background services
│   │   ├── receivers/           # Broadcast receivers
│   │   └── ui/theme/            # App theming
│   ├── src/main/res/            # Resources (layouts, strings, etc.)
│   └── build.gradle.kts         # App dependencies
├── build.gradle.kts             # Project configuration
└── google-services.json        # Firebase configuration
```

## 🚨 Important Notes

1. **Firebase Compatibility:** The app uses the same Firebase project as your web app
2. **Real-time Sync:** All data syncs in real-time between web and Android
3. **Background Location:** App requests background location for emergency tracking
4. **Permissions:** App needs location, notification, and camera permissions
5. **Battery Optimization:** Users may need to disable battery optimization for reliable background operation

## 🔒 Security Features

- End-to-end encryption ready (implement with your encryption library)
- Secure Guardian Key generation
- Firebase Authentication integration
- Location data encryption
- Secure notification handling

## 📞 Testing Checklist

- [ ] Authentication (sign up/in/out)
- [ ] SOS button functionality
- [ ] Emergency contact management
- [ ] Real-time location updates
- [ ] Push notifications
- [ ] Safety tutorial completion
- [ ] Background service operation
- [ ] Firebase data synchronization

## 🐛 Troubleshooting

### Common Issues:

1. **Build Errors:**

   - Ensure `google-services.json` is in correct location
   - Check Kotlin version compatibility
   - Clean and rebuild project

2. **Firebase Issues:**

   - Verify package name matches Firebase configuration
   - Check Firebase project permissions
   - Ensure all Firebase services are enabled

3. **Location Issues:**

   - Test on physical device (not emulator)
   - Grant all location permissions
   - Disable battery optimization for app

4. **Notification Issues:**
   - Check notification permissions
   - Verify Firebase Cloud Messaging setup
   - Test with different Android versions

The Android app is now ready for deployment and should provide the exact same functionality as your React web app!
