import React, { Component, ReactNode } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCw } from "lucide-react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ProfileErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("ProfileErrorBoundary caught an error:", error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <Card className="border shadow-lg bg-white max-w-md mx-auto mt-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              Something went wrong
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-gray-600 text-sm">
              We encountered an error while loading your profile information.
              This is usually temporary.
            </p>

            {process.env.NODE_ENV === "development" && this.state.error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded text-xs font-mono text-red-800">
                {this.state.error.message}
              </div>
            )}

            <div className="flex gap-2">
              <Button
                onClick={this.handleRetry}
                className="flex-1 bg-black text-white hover:bg-gray-800"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Try Again
              </Button>
              <Button
                variant="outline"
                onClick={() => window.location.reload()}
                className="flex-1"
              >
                Reload Page
              </Button>
            </div>

            <p className="text-xs text-gray-500 text-center">
              If this problem persists, please refresh the page or contact
              support.
            </p>
          </CardContent>
        </Card>
      );
    }

    return this.props.children;
  }
}
