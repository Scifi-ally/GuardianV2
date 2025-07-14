@echo off
echo 🔧 Fixing Gradle Wrapper for Guardian Safety
echo ==========================================

echo 📂 Current directory: %cd%

cd android
echo 🗑️ Removing corrupted Gradle wrapper...
rmdir /s /q gradle\wrapper 2>nul
del gradlew 2>nul
del gradlew.bat 2>nul

echo 📥 Regenerating Gradle wrapper...
gradle wrapper --gradle-version 8.0

echo ✅ Gradle wrapper fixed!
echo 🚀 Now building APK...
.\gradlew assembleDebug

if exist "app\build\outputs\apk\debug\app-debug.apk" (
    echo ✅ SUCCESS! APK created at:
    echo android\app\build\outputs\apk\debug\app-debug.apk
) else (
    echo ❌ APK build failed. Try using Android Studio instead.
)

pause
