import React from "react";

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    // Log to console so you can screenshot the exact problem
    // eslint-disable-next-line no-console
    console.error("[ErrorBoundary] Uncaught error:", error, info);
  }

  handleReload = () => {
    // reset boundary state
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ minHeight: "100vh", padding: 16, fontFamily: "system-ui" }}>
          <h2 style={{ margin: 0, fontSize: 18 }}>Sahifa ochilmadi</h2>
          <p style={{ opacity: 0.8, marginTop: 8 }}>
            Xato sababini aniqlash uchun brauzerning <b>Console</b> bo‘limini ochib, chiqgan xatoni rasmga oling.
          </p>
          <pre
            style={{
              background: "#111827",
              color: "#e5e7eb",
              padding: 12,
              borderRadius: 12,
              overflow: "auto",
              marginTop: 12,
              fontSize: 12,
            }}
          >
            {(this.state.error && (this.state.error.stack || String(this.state.error))) || "Unknown error"}
          </pre>
          <button
            onClick={this.handleReload}
            style={{
              marginTop: 12,
              padding: "10px 14px",
              borderRadius: 12,
              border: "1px solid #e5e7eb",
              background: "#fff",
              cursor: "pointer",
            }}
          >
            Qayta urinib ko‘rish
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
