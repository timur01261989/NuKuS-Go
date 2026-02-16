import React from "react";

/**
 * Error Boundary:
 * - Auto-market modul ichida xato bo'lsa, butun ilova "oq ekran" bo'lib qolmasin
 * - Foydalanuvchiga "Qayta urinish" tugmasi beriladi
 */
export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // eslint-disable-next-line no-console
    console.error(`[${this.props.name || "ErrorBoundary"}]`, error, errorInfo);
  }

  handleReload = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div style={{ padding: 24, maxWidth: 520, margin: "0 auto" }}>
        <div style={{ fontSize: 18, fontWeight: 900, marginBottom: 8 }}>
          Xatolik yuz berdi 😕
        </div>
        <div style={{ opacity: 0.75, marginBottom: 16 }}>
          Avto bozor modulida kutilmagan xato chiqdi. Qayta urinib ko‘ring.
        </div>

        <div
          style={{
            background: "#fff",
            border: "1px solid rgba(0,0,0,0.08)",
            borderRadius: 12,
            padding: 12,
            marginBottom: 16,
            fontFamily:
              "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
            fontSize: 12,
            overflow: "auto",
            maxHeight: 180,
          }}
        >
          {String(this.state.error?.message || this.state.error || "Unknown error")}
        </div>

        <button
          onClick={this.handleReload}
          style={{
            border: "none",
            background: "#1677ff",
            color: "#fff",
            padding: "10px 14px",
            borderRadius: 10,
            fontWeight: 800,
            cursor: "pointer",
          }}
        >
          Qayta urinib ko‘rish
        </button>
      </div>
    );
  }
}
