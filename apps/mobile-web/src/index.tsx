import React, { Component, ReactNode, ErrorInfo } from "react";
import ReactDOM from "react-dom/client";
import App from "./App.tsx";
import { ThemeProvider } from "./theme/ThemeProvider";
import "./index.css";

interface ErrorBoundaryProps {
  children?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

// Explicitly use React.Component with generics to ensure state and props are recognized by TypeScript
class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  // Use property initializer for state to fix property access errors
  public state: ErrorBoundaryState = { hasError: false, error: null };

  constructor(props: ErrorBoundaryProps) {
    super(props);
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  render() {
    // Accessing state property from the class instance
    if (this.state.hasError) {
      return (
        <div className="app-shell flex min-h-screen items-center justify-center bg-background p-4 text-text-primary">
          <div className="surface w-full max-w-md rounded-[var(--radius-card)] p-6">
            <h1 className="mb-2 text-xl font-bold text-danger">
              Something went wrong
            </h1>
            <p className="mb-4 text-sm text-text-secondary">
              The application crashed. Please check the console for details.
            </p>
            <pre className="overflow-auto rounded-xl bg-surface-subtle p-3 font-numeric text-xs text-danger">
              {this.state.error?.toString()}
            </pre>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 w-full rounded-[var(--radius-control)] bg-primary px-4 py-2 text-sm font-semibold text-[var(--color-accent-contrast)] transition-transform duration-[var(--motion-fast)] ease-[var(--motion-easing)] active:scale-[0.97]"
            >
              Reload Application
            </button>
          </div>
        </div>
      );
    }

    // Accessing props property from the class instance
    return this.props.children;
  }
}

const rootElement = document.getElementById("root");
if (rootElement) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <ThemeProvider>
        <ErrorBoundary>
          <App />
        </ErrorBoundary>
      </ThemeProvider>
    </React.StrictMode>,
  );
}
