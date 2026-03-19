import React from "react";

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      componentStack: "",
    };

    this.lastComponentStack = "";
  }

  static getDerivedStateFromError(error) {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error, info) {
    // Konsolga to‘liq log
    try {
      console.error("[ErrorBoundary] render failure", {
        error,
        info,
        at: new Date().toISOString(),
      });
    } catch {
      // ignore
    }

    // Monitoring servislarga yuborish (agar mavjud bo‘lsa)
    try {
      if (typeof window !== "undefined" && window.Sentry) {
        window.Sentry.captureException(error, { extra: info });
      }
    } catch {
      // ignore
    }

    // Debug helper: brauzerda oxirgi xatoni saqlash
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

    this.setState({ componentStack: info?.componentStack || "" });
    this.lastComponentStack = info?.componentStack || "";
  }

  handleRetry = () => {
    // Tozalash: global xatoni ham o'chirish
    try {
      if (typeof window !== "undefined") {
        window.__UNIGO_LAST_ERROR = null;
      }
    } catch {
      // ignore
    }
    this.setState({ hasError: false, error: null, componentStack: "" });
  };

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    const err = this.state.error;
    const safeMessage = err?.message
      ? String(err.message)
      : err
      ? Object.prototype.toString.call(err)
      : "Unknown error";
    const safeStack = err?.stack ? String(err.stack) : "";
    const safeComponentStack =
      this.lastComponentStack || this.state.componentStack || "";

    // Debug helper: oxirgi xatoni globalga yozish
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
        <pre style={{ whiteSpace: "pre-wrap", wordBreak: "break-word", textAlign: "left", maxHeight: 400, overflow: "auto" }}>
          {safeMessage}
          {safeStack ? "\n\n" + safeStack : ""}
          {safeComponentStack ? "\n\n" + safeComponentStack : ""}
        </pre>
        <div style={{ marginTop: 12 }}>
          <button
            onClick={this.handleRetry}
            style={{
              marginRight: 8,
              padding: "8px 16px",
              backgroundColor: "#f97316",
              color: "#fff",
              border: "none",
              borderRadius: 6,
              cursor: "pointer",
            }}
          >
            Retry
          </button>
          <button
            onClick={() => {
              try {
                if (typeof window !== "undefined") {
                  // Ba'zan to'liq sahifani qayta yuklash kerak bo'ladi
                  window.location.reload();
                }
              } catch {
                // ignore
              }
            }}
            style={{
              padding: "8px 16px",
              backgroundColor: "#e5e7eb",
              color: "#111827",
              border: "none",
              borderRadius: 6,
              cursor: "pointer",
            }}
          >
            Reload page
          </button>
        </div>
      </div>
    );
  }
}

export default ErrorBoundary;
