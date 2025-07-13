/**
 * Admin Debug Configuration Setup Script
 * Run this once to initialize the debug configuration in Firestore
 *
 * Usage:
 * 1. Install Firebase Admin SDK: npm install firebase-admin
 * 2. Set up service account key (see Firebase console > Project Settings > Service Accounts)
 * 3. Update the serviceAccount path and adminUIDs below
 * 4. Run: node scripts/setup-admin-debug.js
 */

const admin = require("firebase-admin");

// Initialize Firebase Admin SDK
// Replace with your service account key path
const serviceAccount = require("../path/to/your/service-account-key.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://your-project-id-default-rtdb.firebaseio.com",
});

const db = admin.firestore();

// Replace with your actual admin user IDs
const ADMIN_UIDS = ["your-admin-uid-1", "your-admin-uid-2"];

async function setupAdminDebugConfig() {
  try {
    console.log("🔧 Setting up admin debug configuration...");

    // Create the initial debug configuration
    const debugConfig = {
      enabled: false,
      showLocationDebug: false,
      showSystemInfo: false,
      showCoordinates: false,
      showAccuracy: false,
      showConnectionStatus: false,
      enabledBy: null,
      enabledAt: null,
      features: {
        locationDebugPanel: false,
        systemInfoPanel: false,
        coordinateDisplay: false,
        accuracyIndicator: false,
        connectionIndicator: false,
        performanceMetrics: false,
      },
      metadata: {
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        createdBy: "setup-script",
        version: "1.0.0",
        description: "Admin-controlled debug configuration for Guardian app",
      },
    };

    // Create the document
    await db.collection("admin").doc("debugConfig").set(debugConfig);
    console.log("✅ Debug configuration document created successfully");

    // Set custom admin claims for admin users
    console.log("🔐 Setting up admin user claims...");

    for (const uid of ADMIN_UIDS) {
      try {
        await admin.auth().setCustomUserClaims(uid, { admin: true });
        console.log(`✅ Admin claim set for user: ${uid}`);
      } catch (error) {
        console.warn(
          `⚠️  Could not set admin claim for ${uid}:`,
          error.message,
        );
      }
    }

    console.log("\n🎉 Setup complete!");
    console.log("\n📋 Next steps:");
    console.log("1. Update firestore.rules with your admin UIDs");
    console.log("2. Deploy Firestore rules");
    console.log("3. Test debug mode by enabling it in Firebase console");
    console.log("\n🔍 To enable debug mode:");
    console.log("- Go to Firestore > admin > debugConfig");
    console.log("- Set enabled: true");
    console.log("- Enable desired features in the features object");
  } catch (error) {
    console.error("❌ Setup failed:", error);
  } finally {
    process.exit();
  }
}

// Helper function to create sample debug configurations
async function createSampleConfigs() {
  const configs = {
    // Basic debug config
    basic: {
      enabled: true,
      features: {
        locationDebugPanel: true,
        systemInfoPanel: false,
        coordinateDisplay: false,
        accuracyIndicator: true,
        connectionIndicator: true,
        performanceMetrics: false,
      },
    },

    // Full debug config
    full: {
      enabled: true,
      features: {
        locationDebugPanel: true,
        systemInfoPanel: true,
        coordinateDisplay: true,
        accuracyIndicator: true,
        connectionIndicator: true,
        performanceMetrics: true,
      },
    },

    // Disabled config
    disabled: {
      enabled: false,
      features: {
        locationDebugPanel: false,
        systemInfoPanel: false,
        coordinateDisplay: false,
        accuracyIndicator: false,
        connectionIndicator: false,
        performanceMetrics: false,
      },
    },
  };

  console.log("\n📝 Sample configurations:");
  console.log(JSON.stringify(configs, null, 2));
}

// Run setup
if (require.main === module) {
  setupAdminDebugConfig();
  createSampleConfigs();
}

module.exports = { setupAdminDebugConfig };
