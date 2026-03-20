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
import api from "@/modules/shared/utils/apiHelper";

bootstrapRuntime();

api.configure({
  baseUrl: import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_BASE || "",
  retry: {
    enabled: true,
    max: 1,
    methods: ["GET", "POST", "PUT", "PATCH"],
    statuses: [429, 500, 502, 503, 504],
    baseDelayMs: 300,
  },
  cache: {
    enabled: false,
    ttlMs: 0,
  },
  onError: ({ url, method, status, error }) => {
    console.warn("apiHelper error", { url, method, status, error });
  },
});

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
