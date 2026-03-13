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
  }

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    return (
      <div style={{ padding: 16, textAlign: "center" }}>
        <h2>Something went wrong.</h2>
        <pre style={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
          {this.state.error?.stack || this.state.error?.message || String(this.state.error || "Unknown error")}
        </pre>
      </div>
    );
  }
}

export default ErrorBoundary;
