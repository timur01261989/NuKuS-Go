import React from "react";

/**
 * ErrorBoundary
 * - Production'da oq ekran bo'lib qolmasin
 * - Console'ga real xatoni chiqaradi
 */
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
    console.error("[ErrorBoundary]", error, info);
          <h3 style={{ margin: 0, marginBottom: 8 }}>Ilovada xato chiqdi</h3>
          <pre style={{ whiteSpace: "pre-wrap", fontSize: 12, opacity: 0.9 }}>
            {String(this.state.error)}
          </pre>
          <button
            onClick={() => window.location.reload()}
            style={{ padding: "10px 12px", borderRadius: 10, cursor: "pointer" }}
          >
            Qayta yuklash
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
