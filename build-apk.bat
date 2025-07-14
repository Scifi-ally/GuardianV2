@echo off
echo 🛡️ Guardian Safety - APK Build Script
echo =====================================

echo 📦 Building web app...
call npm run build
if errorlevel 1 (
    echo ❌ Web build failed!
    pause
    exit /b 1
)

echo 🔄 Syncing with Capacitor...
call npx cap sync
if errorlevel 1 (
    echo ❌ Capacitor sync failed!
    pause
    exit /b 1
)

echo 🤖 Building Android APK...
cd android
call gradlew assembleDebug
if errorlevel 1 (
    echo ❌ Android build failed!
    cd ..
    pause
    exit /b 1
)

cd ..
echo ✅ APK build complete!
echo 📂 APK Location: android\app\build\outputs\apk\debug\app-debug.apk

if exist "android\app\build\outputs\apk\debug\app-debug.apk" (
    echo 📱 APK Size:
    dir "android\app\build\outputs\apk\debug\app-debug.apk" | findstr app-debug.apk
    echo.
    echo 🚀 You can now install this APK on your Android device!
    echo 📲 To install: adb install android\app\build\outputs\apk\debug\app-debug.apk
) else (
    echo ❌ APK file not found. Check build logs above.
)

pause
