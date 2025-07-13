import React, { Component, ErrorInfo, ReactNode } from "react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class MotionErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    // Check if this is a Framer Motion interpolation error
    const isMotionError =
      error.message.includes("a is not a function") ||
      error.message.includes("interpolate") ||
      error.message.includes("framer-motion") ||
      error.stack?.includes("framer-motion");

    if (isMotionError) {
      console.warn("Framer Motion error caught by boundary:", error);
      return { hasError: true, error };
    }

    // Re-throw non-motion errors
    throw error;
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log the error for debugging
    console.error("Motion Error Boundary caught an error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      // Render fallback UI without motion
      return (
        this.props.fallback || (
          <div className="text-muted-foreground text-sm">
            {this.props.children}
          </div>
        )
      );
    }

    return this.props.children;
  }
}

/**
 * Higher-order component to wrap components with motion error boundary
 */
export function withMotionErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  fallback?: ReactNode,
) {
  const WrappedComponent = (props: P) => (
    <MotionErrorBoundary fallback={fallback}>
      <Component {...props} />
    </MotionErrorBoundary>
  );

  WrappedComponent.displayName = `withMotionErrorBoundary(${Component.displayName || Component.name})`;

  return WrappedComponent;
}

export default MotionErrorBoundary;
