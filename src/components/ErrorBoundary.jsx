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
    // eslint-disable-next-line no-console
    console.error("[ErrorBoundary] Uncaught error:", error, info);
  }

  render() {
    if (this.state.hasError) {
      const txt = (this.state.error && (this.state.error.stack || String(this.state.error))) || "Unknown error";
      return (
        <div style={{ minHeight: "100vh", padding: 16, fontFamily: "system-ui" }}>
          <h2 style={{ margin: 0, fontSize: 18 }}>Sahifa ochilmadi</h2>
          <p style={{ opacity: 0.85, marginTop: 8 }}>
            Konsolda chiqgan xatoni rasmga oling va yuboring — shu xatoning o‘zini tuzatamiz.
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
            {txt}
          </pre>
        </div>
      );
    }
    return this.props.children;
  }
}
