import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Database,
  User,
  Shield,
  AlertTriangle,
  CheckCircle,
  XCircle,
  RefreshCw,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { auth, db } from "@/lib/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";

export function FirebaseDebug() {
  const { currentUser } = useAuth();
  const [dbStatus, setDbStatus] = useState<"checking" | "connected" | "failed">(
    "checking",
  );
  const [authStatus, setAuthStatus] = useState<
    "checking" | "authenticated" | "unauthenticated"
  >("checking");
  const [testResults, setTestResults] = useState<{
    read: boolean | null;
    write: boolean | null;
  }>({ read: null, write: null });

  useEffect(() => {
    checkFirebaseStatus();
  }, [currentUser]);

  const checkFirebaseStatus = async () => {
    // Check auth status
    if (currentUser) {
      setAuthStatus("authenticated");
    } else {
      setAuthStatus("unauthenticated");
    }

    // Check database connection
    try {
      // Test basic Firestore connection
      const testDoc = doc(db, "test", "connection");
      await getDoc(testDoc);
      setDbStatus("connected");

      // Test read/write permissions if authenticated
      if (currentUser) {
        await testPermissions(currentUser.uid);
      }
    } catch (error) {
      console.error("Firebase connection test failed:", error);
      setDbStatus("failed");
    }
  };

  const testPermissions = async (userId: string) => {
    try {
      // Test read
      try {
        const userDoc = await getDoc(doc(db, "userSettings", userId));
        setTestResults((prev) => ({ ...prev, read: true }));
        console.log("✅ Read permission test passed");
      } catch (error) {
        setTestResults((prev) => ({ ...prev, read: false }));
        console.error("❌ Read permission test failed:", error);
      }

      // Test write
      try {
        const testData = {
          testField: "test",
          timestamp: new Date(),
        };
        await setDoc(doc(db, "userSettings", userId), testData, {
          merge: true,
        });
        setTestResults((prev) => ({ ...prev, write: true }));
        console.log("✅ Write permission test passed");
      } catch (error) {
        setTestResults((prev) => ({ ...prev, write: false }));
        console.error("❌ Write permission test failed:", error);
      }
    } catch (error) {
      console.error("Permission tests failed:", error);
      setTestResults({ read: false, write: false });
    }
  };

  const StatusIndicator = ({
    status,
    successText,
    failText,
    checkingText = "Checking...",
  }: {
    status: string;
    successText: string;
    failText: string;
    checkingText?: string;
  }) => {
    if (status === "checking") {
      return (
        <Badge variant="outline" className="text-blue-600">
          <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
          {checkingText}
        </Badge>
      );
    }

    const isSuccess =
      status === "connected" || status === "authenticated" || status === true;

    return (
      <Badge
        variant={isSuccess ? "default" : "destructive"}
        className={
          isSuccess
            ? "bg-green-500 text-white"
            : "bg-red-500 text-white border-red-600"
        }
      >
        {isSuccess ? (
          <CheckCircle className="h-3 w-3 mr-1" />
        ) : (
          <XCircle className="h-3 w-3 mr-1" />
        )}
        {isSuccess ? successText : failText}
      </Badge>
    );
  };

  return (
    <Card className="border-blue-200 bg-blue-50">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Database className="h-4 w-4 text-blue-600" />
          Firebase Connection Status
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-1 gap-3">
          {/* Auth Status */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-blue-600" />
              <span className="text-sm">Authentication</span>
            </div>
            <StatusIndicator
              status={authStatus}
              successText="Signed In"
              failText="Not Signed In"
            />
          </div>

          {/* Database Status */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Database className="h-4 w-4 text-blue-600" />
              <span className="text-sm">Database</span>
            </div>
            <StatusIndicator
              status={dbStatus}
              successText="Connected"
              failText="Connection Failed"
            />
          </div>

          {/* Read Permission */}
          {currentUser && (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-blue-600" />
                <span className="text-sm">Read Permission</span>
              </div>
              <StatusIndicator
                status={testResults.read}
                successText="Allowed"
                failText="Denied"
                checkingText="Testing..."
              />
            </div>
          )}

          {/* Write Permission */}
          {currentUser && (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-blue-600" />
                <span className="text-sm">Write Permission</span>
              </div>
              <StatusIndicator
                status={testResults.write}
                successText="Allowed"
                failText="Denied"
                checkingText="Testing..."
              />
            </div>
          )}
        </div>

        {/* Debug Info */}
        {currentUser && (
          <div className="mt-3 p-2 bg-blue-100 rounded text-xs">
            <div>
              <strong>User ID:</strong> {currentUser.uid}
            </div>
            <div>
              <strong>Email:</strong> {currentUser.email}
            </div>
            <div>
              <strong>Email Verified:</strong>{" "}
              {currentUser.emailVerified ? "Yes" : "No"}
            </div>
          </div>
        )}

        {/* Retry Button */}
        <Button
          size="sm"
          variant="outline"
          onClick={checkFirebaseStatus}
          className="w-full mt-3 border-blue-300 text-blue-700 hover:bg-blue-100"
        >
          <RefreshCw className="h-3 w-3 mr-1" />
          Retest Connection
        </Button>

        {/* Instructions */}
        {(dbStatus === "failed" ||
          testResults.read === false ||
          testResults.write === false) && (
          <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded">
            <div className="flex items-center gap-2 mb-1">
              <AlertTriangle className="h-3 w-3 text-red-600" />
              <span className="text-xs font-medium text-red-800">
                Connection Issues Detected
              </span>
            </div>
            <ul className="text-xs text-red-700 space-y-1">
              <li>• Make sure you're signed in</li>
              <li>• Check your internet connection</li>
              <li>• Firestore rules may need updating</li>
              <li>• Try refreshing the page</li>
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
