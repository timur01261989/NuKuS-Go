import React from "react";

function safeStringify(value) {
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

export default class AppErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      info: null,
      at: null,
    };
  }

  static getDerivedStateFromError(error) {
    return {
      hasError: true,
      error,
      at: new Date().toISOString(),
    };
  }

  componentDidCatch(error, info) {
    console.error("[ERROR_BOUNDARY] render crash captured", {
      error,
      info,
      pathname: typeof window !== "undefined" ? window.location.pathname : null,
      href: typeof window !== "undefined" ? window.location.href : null,
      at: new Date().toISOString(),
    });

    this.setState({ info });
  }

  handleReload = () => {
    if (typeof window !== "undefined") {
      window.location.reload();
    }
  };

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    const errorMessage = this.state.error?.stack || this.state.error?.message || String(this.state.error || "Unknown error");
    const componentStack = this.state.info?.componentStack || "";

    return (
      <div
        style={{
          minHeight: "100vh",
          background: "#f8fafc",
          color: "#0f172a",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 24,
          boxSizing: "border-box",
        }}
      >
        <div
          style={{
            width: "100%",
            maxWidth: 920,
            background: "#ffffff",
            border: "1px solid #e2e8f0",
            borderRadius: 16,
            padding: 20,
            boxShadow: "0 10px 30px rgba(15, 23, 42, 0.08)",
          }}
        >
          <h2 style={{ marginTop: 0, marginBottom: 12 }}>Ilovada render xatolik yuz berdi</h2>
          <p style={{ marginTop: 0, marginBottom: 16, lineHeight: 1.5 }}>
            Bu sahifa React render vaqtida qulab tushdi. Quyidagi ma&apos;lumotlar orqali qaysi component yoki qaysi qator yiqilayotganini topish osonlashadi.
          </p>

          <div style={{ marginBottom: 16 }}>
            <strong>Vaqt:</strong> {this.state.at || "-"}
            <br />
            <strong>Sahifa:</strong> {typeof window !== "undefined" ? window.location.pathname : "-"}
          </div>

          <div style={{ marginBottom: 16 }}>
            <strong>Xato:</strong>
            <pre
              style={{
                whiteSpace: "pre-wrap",
                wordBreak: "break-word",
                background: "#0f172a",
                color: "#e2e8f0",
                borderRadius: 12,
                padding: 12,
                overflowX: "auto",
              }}
            >
              {errorMessage}
            </pre>
          </div>

          <div style={{ marginBottom: 16 }}>
            <strong>Component stack:</strong>
            <pre
              style={{
                whiteSpace: "pre-wrap",
                wordBreak: "break-word",
                background: "#111827",
                color: "#d1d5db",
                borderRadius: 12,
                padding: 12,
                overflowX: "auto",
              }}
            >
              {componentStack || "Component stack yo'q"}
            </pre>
          </div>

          <details>
            <summary style={{ cursor: "pointer", fontWeight: 600 }}>Internal state</summary>
            <pre
              style={{
                whiteSpace: "pre-wrap",
                wordBreak: "break-word",
                background: "#f1f5f9",
                borderRadius: 12,
                padding: 12,
                overflowX: "auto",
              }}
            >
              {safeStringify(this.state)}
            </pre>
          </details>

          <div style={{ marginTop: 20, display: "flex", gap: 12, flexWrap: "wrap" }}>
            <button
              type="button"
              onClick={this.handleReload}
              style={{
                border: 0,
                borderRadius: 10,
                background: "#2563eb",
                color: "#fff",
                padding: "10px 14px",
                cursor: "pointer",
              }}
            >
              Sahifani qayta yuklash
            </button>
          </div>
        </div>
      </div>
    );
  }
}
