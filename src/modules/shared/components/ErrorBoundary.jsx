import React from "react";

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      componentStack: "",
    };

    // componentDidCatch() ichida setState async bo'lishi mumkin.
    // Shuning uchun render()da darhol ko'rinishi uchun componentStack'ni instance variablega yozamiz.
    this.lastComponentStack = "";
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

    try {
      this.setState({ componentStack: info?.componentStack || "" });
    } catch {
      // ignore
    }

    try {
      this.lastComponentStack = info?.componentStack || "";
    } catch {
      // ignore
    }
  }

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    // Ensure debug info is available even if componentDidCatch didn't run
    const err = this.state.error;
    const safeMessage = err?.message
      ? String(err.message)
      : err
        ? Object.prototype.toString.call(err)
        : "Unknown error";
    const safeStack = err?.stack ? String(err.stack) : "";
    const safeComponentStack = this.lastComponentStack
      ? String(this.lastComponentStack)
      : this.state.componentStack
        ? String(this.state.componentStack)
        : "";

    try {
      if (typeof window !== "undefined") {
        window.__UNIGO_LAST_ERROR = {
          name: this.state.error?.name || "Error",
          message: safeMessage,
          stack: safeStack,
          componentStack: safeComponentStack,
        };
      }
    } catch {
      // ignore
    }

    return (
      <div style={{ padding: 16, textAlign: "center" }}>
        <h2>Something went wrong.</h2>
        <pre style={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
          {safeMessage}
          {safeStack ? "\n\n" + safeStack : ""}
          {safeComponentStack ? "\n\n" + safeComponentStack : ""}
        </pre>
      </div>
    );
  }
}

export default ErrorBoundary;
