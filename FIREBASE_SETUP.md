# Firebase Setup Guide for Guardian Women's Safety App

## 1. Firebase Console Configuration

### Step 1: Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Click "Add project"
3. Name: `guardian-womens-safety`
4. Enable Google Analytics (optional)
5. Choose analytics account or create new

### Step 2: Enable Authentication

1. Go to **Authentication** → **Sign-in method**
2. Enable providers:
   - ✅ **Email/Password** (primary)
   - ✅ **Google** (optional, for easier signup)
   - ✅ **Anonymous** (for emergency guest access)

### Step 3: Create Firestore Database

1. Go to **Firestore Database**
2. Click "Create database"
3. Choose **Production mode**
4. Select region (choose closest to your users)

### Step 4: Configure Firestore Security Rules

1. Go to **Firestore Database** → **Rules**
2. Copy content from `firestore.rules` file
3. Click **Publish**

### Step 5: Enable Cloud Storage

1. Go to **Storage**
2. Click "Get started"
3. Choose **Production mode**
4. Select same region as Firestore

### Step 6: Configure Storage Security Rules

1. Go to **Storage** → **Rules**
2. Copy content from `storage.rules` file
3. Click **Publish**

## 2. Required Firestore Indexes

### Composite Indexes (create these manually):

```javascript
// Collection: sosAlerts
// Fields: receiverIds (Array), status (Ascending), createdAt (Descending)

// Collection: sosAlerts
// Fields: senderId (Ascending), status (Ascending), createdAt (Descending)

// Collection: sosResponses
// Fields: alertId (Ascending), timestamp (Descending)

// Collection: users
// Fields: guardianKey (Ascending)

// Collection: guardianKeys
// Fields: guardianKey (Ascending), userId (Ascending)
```

### Creating Indexes:

1. Go to **Firestore Database** → **Indexes**
2. Click **Add index**
3. Add each composite index above
4. Or deploy with Firebase CLI using the index configuration

## 3. Cloud Functions Setup (Optional but Recommended)

### Install Firebase CLI:

```bash
npm install -g firebase-tools
firebase login
firebase init functions
```

### Essential Cloud Functions:

#### 3.1 SOS Alert Notification Function

```javascript
// functions/src/index.ts
exports.sendSOSNotification = functions.firestore
  .document("sosAlerts/{alertId}")
  .onCreate(async (snap, context) => {
    const alertData = snap.data();
    const receiverIds = alertData.receiverIds;

    // Send push notifications to all receivers
    const messaging = admin.messaging();
    const tokens = await getDeviceTokens(receiverIds);

    const message = {
      notification: {
        title: `🚨 EMERGENCY ALERT`,
        body: `${alertData.senderName} needs immediate help!`,
        icon: "/icon-192x192.png",
        badge: "/badge-72x72.png",
        tag: "emergency",
        requireInteraction: true,
        silent: false,
      },
      data: {
        alertId: context.params.alertId,
        senderId: alertData.senderId,
        senderName: alertData.senderName,
        priority: alertData.priority,
        type: "sos_alert",
        click_action: "/guardian",
      },
      tokens: tokens,
    };

    return messaging.sendMulticast(message);
  });
```

#### 3.2 Guardian Key Validation Function

```javascript
exports.validateGuardianKey = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "Must be authenticated",
    );
  }

  const { guardianKey } = data;
  const keyDoc = await admin
    .firestore()
    .collection("guardianKeys")
    .doc(guardianKey)
    .get();

  return {
    valid: keyDoc.exists,
    userData: keyDoc.exists ? keyDoc.data() : null,
  };
});
```

## 4. Security Configuration

### 4.1 App Check (Recommended for Production)

1. Go to **App Check**
2. Register your web app
3. Choose provider: **reCAPTCHA v3**
4. Add site key to your app

### 4.2 Identity and Access Management (IAM)

1. Go to **IAM & Admin** → **IAM**
2. Set up service accounts for:
   - Cloud Functions execution
   - Admin SDK operations
   - Backup operations

## 5. Performance Monitoring

### 5.1 Enable Performance Monitoring

1. Go to **Performance**
2. Click "Get started"
3. Add Performance SDK to your app

### 5.2 Enable Crashlytics

1. Go to **Crashlytics**
2. Click "Get started"
3. Add Crashlytics SDK

## 6. Environment Variables Setup

### 6.1 Development Environment (.env.local):

```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id
```

### 6.2 Production Environment:

- Set same variables in your hosting platform
- Use Firebase Hosting for optimal performance

## 7. Testing Setup

### 7.1 Firebase Emulator Suite

```bash
firebase init emulators
# Select: Authentication, Firestore, Storage, Functions

# Start emulators
firebase emulators:start
```

### 7.2 Test Data Population

```javascript
// Create test users and guardian keys
// Simulate SOS alerts
// Test emergency contact flows
```

## 8. Deployment

### 8.1 Deploy Security Rules:

```bash
firebase deploy --only firestore:rules
firebase deploy --only storage
```

### 8.2 Deploy Functions:

```bash
firebase deploy --only functions
```

### 8.3 Deploy to Firebase Hosting:

```bash
npm run build
firebase deploy --only hosting
```

## 9. Monitoring & Alerts

### 9.1 Set up Cloud Monitoring alerts for:

- Failed authentication attempts
- High SOS alert volumes
- Database quota exceeded
- Storage quota exceeded

### 9.2 Error Reporting:

- Monitor Cloud Functions errors
- Set up Slack/email notifications
- Create dashboards for key metrics

## 10. Compliance & Privacy

### 10.1 Data Privacy:

- Implement data retention policies
- Allow users to export their data
- Provide data deletion capabilities
- GDPR/CCPA compliance features

### 10.2 Audit Logging:

- Log all security-relevant events
- Monitor data access patterns
- Regular security reviews

---

## Quick Commands Reference:

```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login to Firebase
firebase login

# Initialize project
firebase init

# Deploy rules only
firebase deploy --only firestore:rules,storage

# Deploy everything
firebase deploy

# Start local emulators
firebase emulators:start

# View logs
firebase functions:log
```

## Support Resources:

- [Firebase Documentation](https://firebase.google.com/docs)
- [Firestore Security Rules Guide](https://firebase.google.com/docs/firestore/security/get-started)
- [Firebase Auth Documentation](https://firebase.google.com/docs/auth)
- [Cloud Functions Documentation](https://firebase.google.com/docs/functions)
