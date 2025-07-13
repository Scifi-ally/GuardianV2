# Admin Debug Mode Setup Guide

This guide explains how to set up and control the admin-only debug mode for the Guardian app.

## Overview

The app now has a production-ready configuration where all debug elements are hidden by default. Only administrators can enable debug mode through Firebase Firestore.

## Firebase Setup

### 1. Create Debug Configuration Document

In your Firebase Firestore console, create the following document:

**Collection:** `admin`  
**Document ID:** `debugConfig`

**Document Structure:**

```json
{
  "enabled": false,
  "showLocationDebug": false,
  "showSystemInfo": false,
  "showCoordinates": false,
  "showAccuracy": false,
  "showConnectionStatus": false,
  "enabledBy": "",
  "enabledAt": null,
  "features": {
    "locationDebugPanel": false,
    "systemInfoPanel": false,
    "coordinateDisplay": false,
    "accuracyIndicator": false,
    "connectionIndicator": false,
    "performanceMetrics": false
  }
}
```

### 2. Firestore Security Rules

Add these rules to your `firestore.rules` file:

```javascript
// Admin debug configuration - only allow admins
match /admin/debugConfig {
  allow read: if request.auth != null;
  allow write: if request.auth != null &&
    (request.auth.token.admin == true ||
     request.auth.uid in ['YOUR_ADMIN_UID_1', 'YOUR_ADMIN_UID_2']);
}
```

**Replace `YOUR_ADMIN_UID_1`, `YOUR_ADMIN_UID_2` with your actual Firebase Auth UIDs.**

### 3. Admin User Setup

Option A - Custom Claims (Recommended):

```javascript
// Set admin custom claim via Firebase Admin SDK
admin.auth().setCustomUserClaims(uid, { admin: true });
```

Option B - Hardcoded UIDs:
Update the security rules with your specific admin UIDs.

## How to Enable Debug Mode

### For Admins:

1. **Access Firebase Console**

   - Go to your Firebase project
   - Navigate to Firestore Database
   - Find the `admin` collection

2. **Enable Debug Mode**

   - Edit the `debugConfig` document
   - Set `enabled: true`
   - Enable specific features you want:
     ```json
     {
       "enabled": true,
       "enabledBy": "admin@guardian.com",
       "enabledAt": "2024-01-15T10:30:00Z",
       "features": {
         "locationDebugPanel": true,
         "systemInfoPanel": true,
         "coordinateDisplay": false,
         "accuracyIndicator": true,
         "connectionIndicator": false,
         "performanceMetrics": false
       }
     }
     ```

3. **Users Will See Debug Info**

   - Changes take effect immediately (real-time)
   - Users will see admin debug panels
   - Yellow warning indicators show admin debug is active

4. **Disable Debug Mode**
   - Set `enabled: false` in the document
   - All debug info disappears immediately

## Available Debug Features

| Feature               | Description                                   | Production Impact |
| --------------------- | --------------------------------------------- | ----------------- |
| `locationDebugPanel`  | Show location coordinates, accuracy, GPS info | Low               |
| `systemInfoPanel`     | Show system information, browser details      | Low               |
| `coordinateDisplay`   | Show GPS coordinates on map                   | Medium            |
| `accuracyIndicator`   | Show location accuracy indicators             | Low               |
| `connectionIndicator` | Show online/offline status                    | Low               |
| `performanceMetrics`  | Show performance monitoring data              | Medium            |

## Security Considerations

✅ **Safe for Production:**

- Debug mode is completely disabled by default
- Only authenticated admins can enable it
- Real-time control via Firebase
- No debug data stored locally
- Users cannot enable debug mode themselves

✅ **Privacy Protected:**

- Debug info only shows when admin enables it
- Clear visual indicators when debug mode is active
- Can be disabled instantly

## Development Override

For development only, developers can temporarily enable debug mode:

```javascript
// Only works in development environment
if (import.meta.env.DEV) {
  adminDebugService.devModeOverride(true);
}
```

This override:

- Only works in development builds
- Does not affect production
- Enables all debug features locally

## Monitoring

The system logs when debug mode is enabled:

- Who enabled it (`enabledBy`)
- When it was enabled (`enabledAt`)
- Which features are active

## Example Admin Workflow

1. **Troubleshooting User Issue:**

   ```
   Admin enables "locationDebugPanel" →
   User refreshes app →
   Debug panel appears →
   Admin can see GPS coordinates/accuracy →
   Issue diagnosed →
   Admin disables debug mode
   ```

2. **Performance Monitoring:**

   ```
   Admin enables "performanceMetrics" →
   Users see performance data →
   Admin collects data →
   Debug mode disabled when done
   ```

3. **System Status Check:**
   ```
   Admin enables "systemInfoPanel" →
   Check user browser/system info →
   Identify compatibility issues →
   Disable when analysis complete
   ```

## Troubleshooting

**Debug mode not showing up:**

- Check Firestore security rules
- Verify admin permissions
- Confirm document structure
- Check browser console for errors

**Changes not appearing:**

- Debug config uses real-time listeners
- Should appear within 1-2 seconds
- Try refreshing the app
- Check Firebase connection

**Security concerns:**

- Debug mode shows user location data
- Only enable when necessary
- Always disable after troubleshooting
- Monitor who has admin access
