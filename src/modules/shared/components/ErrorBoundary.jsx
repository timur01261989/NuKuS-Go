import React from "react";

/**
 * ErrorBoundary.jsx
 *
 * Robust Error Boundary for React class components.
 * - Captures render/runtime errors and component stack.
 * - Logs full error details to console and optional monitoring (Sentry).
 * - Exposes last error snapshot on window.__UNIGO_LAST_ERROR for quick inspection.
 * - Provides Retry (reset boundary) and Reload page actions.
 *
 * Usage:
 * <ErrorBoundary>
 *   <App />
 * </ErrorBoundary>
 */

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
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    // Defensive logging: try/catch to avoid logging failures crashing app
    try {
      // Structured console log for Vercel / browser logs
      console.error("[ErrorBoundary] render failure", {
        error,
        info,
        at: new Date().toISOString(),
      });
    } catch (e) {
      // ignore logging errors
    }

    // Send to monitoring if available (Sentry or similar)
    try {
      if (typeof window !== "undefined" && window.Sentry && typeof window.Sentry.captureException === "function") {
        window.Sentry.captureException(error, { extra: info });
      }
    } catch {
      // ignore monitoring failures
    }

    // Save detailed snapshot globally for quick debugging in console
    try {
      if (typeof window !== "undefined") {
        const raw = (() => {
          try {
            const all = {};
            Object.getOwnPropertyNames(error || {}).forEach((k) => {
              try { all[k] = error[k]; } catch { all[k] = String(error[k]); }
            });
            return all;
          } catch {
            return null;
          }
        })();

        window.__UNIGO_LAST_ERROR = {
          name: error?.name || "Error",
          message: error?.message || String(error || ""),
          stack: error?.stack || "",
          componentStack: info?.componentStack || "",
          raw,
          timestamp: new Date().toISOString(),
        };
      }
    } catch {
      // ignore global write failures
    }

    this.setState({ componentStack: info?.componentStack || "" });
    this.lastComponentStack = info?.componentStack || "";
  }

  handleRetry = () => {
    try {
      if (typeof window !== "undefined") {
        window.__UNIGO_LAST_ERROR = null;
      }
    } catch {
      // ignore
    }
    this.setState({ hasError: false, error: null, componentStack: "" });
  };

  handleReload = () => {
    try {
      if (typeof window !== "undefined") {
        window.location.reload();
      }
    } catch {
      // ignore
    }
  };

  renderErrorDetails() {
    const err = this.state.error;
    const safeMessage = err?.message ? String(err.message) : String(err || "Unknown error");
    const safeStack = err?.stack ? String(err.stack) : "";
    const safeComponentStack = this.lastComponentStack || this.state.componentStack || "";

    return (
      <pre
        style={{
          whiteSpace: "pre-wrap",
          wordBreak: "break-word",
          textAlign: "left",
          maxHeight: 420,
          overflow: "auto",
          background: "#111827",
          color: "#f8fafc",
          padding: 12,
          borderRadius: 6,
        }}
      >
        {safeMessage}
        {safeStack ? "\n\n" + safeStack : ""}
        {safeComponentStack ? "\n\n" + safeComponentStack : ""}
      </pre>
    );
  }

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    return (
      <div style={{ padding: 20, display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
        <div style={{ maxWidth: 900, width: "100%" }}>
          <h2 style={{ margin: 0, color: "#111827" }}>Something went wrong.</h2>
          <p style={{ marginTop: 8, color: "#6b7280" }}>
            Ilova xatosi yuz berdi. Quyidagi ma'lumotlarni tekshirib chiqing yoki sahifani qayta yuklang.
          </p>

          <div style={{ marginTop: 12 }}>{this.renderErrorDetails()}</div>

          <div style={{ marginTop: 12, display: "flex", gap: 8 }}>
            <button
              onClick={this.handleRetry}
              style={{
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
              onClick={this.handleReload}
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

            <button
              onClick={() => {
                try {
                  if (typeof navigator !== "undefined" && navigator.clipboard) {
                    const payload = JSON.stringify(window.__UNIGO_LAST_ERROR || { message: "no error snapshot" }, null, 2);
                    navigator.clipboard.writeText(payload);
                    // eslint-disable-next-line no-alert
                    alert("Error snapshot copied to clipboard");
                  } else {
                    // eslint-disable-next-line no-alert
                    alert("Clipboard not available");
                  }
                } catch {
                  // eslint-disable-next-line no-alert
                  alert("Failed to copy error snapshot");
                }
              }}
              style={{
                padding: "8px 16px",
                backgroundColor: "#3b82f6",
                color: "#fff",
                border: "none",
                borderRadius: 6,
                cursor: "pointer",
              }}
            >
              Copy error snapshot
            </button>
          </div>

          <div style={{ marginTop: 12, color: "#6b7280", fontSize: 13 }}>
            <div>Tip: open browser console and run <code>console.log(window.__UNIGO_LAST_ERROR)</code> for raw details.</div>
          </div>
        </div>
      </div>
    );
  }
}

export default ErrorBoundary;
