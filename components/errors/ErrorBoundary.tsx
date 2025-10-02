import React, { Component, ErrorInfo, ReactNode } from 'react';
import LoadingError from './LoadingError';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(_: Error): State {
    // Update state so the next render will show the fallback UI.
    return { hasError: true };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // In a real app, you would log this to an error reporting service
    console.error("Uncaught error:", error, errorInfo);
  }

  private handleRetry = () => {
    // A full page reload is a simple and effective way to reset the app state.
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white">
            <div className="w-full max-w-lg p-8">
                <LoadingError onRetry={this.handleRetry} message="The application encountered a critical error."/>
            </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;