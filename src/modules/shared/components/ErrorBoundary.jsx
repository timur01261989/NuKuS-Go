import React from "react";

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  static getDerivedStateFromError(error) {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error, info) {
    console.error("[ErrorBoundary] render failure", {
      error,
      info,
      at: new Date().toISOString(),
    });

    // Debug helper: Vercel productionda minified stack bo'lsa ham xatoni aniq ko'rish uchun
    try {
      if (typeof window !== "undefined") {
        window.__UNIGO_LAST_ERROR = {
          name: error?.name || "Error",
          message: error?.message || "",
          stack: error?.stack || "",
          componentStack: info?.componentStack || "",
        };
      }
    } catch {
      // ignore
    }
  }

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    // Ensure debug info is available even if componentDidCatch didn't run
    try {
      if (typeof window !== "undefined") {
        window.__UNIGO_LAST_ERROR = {
          name: this.state.error?.name || "Error",
          message: this.state.error?.message || "",
          stack: this.state.error?.stack || "",
        };
      }
    } catch {
      // ignore
    }

    return (
      <div style={{ padding: 16, textAlign: "center" }}>
        <h2>Something went wrong.</h2>
        <pre style={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
          {this.state.error?.stack ||
            (this.state.error?.message ? String(this.state.error.message) : null) ||
            String(this.state.error || "Unknown error")}
        </pre>
      </div>
    );
  }
}

export default ErrorBoundary;
