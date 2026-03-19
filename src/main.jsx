import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import ErrorBoundary from "./modules/shared/components/ErrorBoundary.jsx";
import AppErrorBoundary from "./modules/shared/debug/AppErrorBoundary.jsx";
import AppProviders from "./app/providers/AppProviders.jsx";
import { bootstrapRuntime } from "./bootstrap/runtimeBootstrap.js";
import { BrowserRouter } from "react-router-dom";

import "antd/dist/reset.css";
import "leaflet/dist/leaflet.css";
import "./styles/globals.css";

bootstrapRuntime();

// Service worker bootstrap disabled in web deployment to avoid stale cache/manifest issues.

const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error("Root element with id 'root' not found");
}

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <AppErrorBoundary>
      <AppProviders>
        <BrowserRouter>
          <ErrorBoundary>
            <App />
          </ErrorBoundary>
        </BrowserRouter>
      </AppProviders>
    </AppErrorBoundary>
  </React.StrictMode>,
);
