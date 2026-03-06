/**
 * AppModeProvider.jsx - Global App Mode Management
 * 
 * Manages whether the user is in "client" or "driver" mode
 * This prevents drivers from being forced to client mode after login
 * 
 * INSTALLATION:
 * 1. Copy this file to: src/providers/AppModeProvider.jsx
 * 2. Update src/App.jsx (see App.jsx.FIXED below)
 */

import { createContext, useContext, useState, useEffect } from "react";

// Create the context
const AppModeContext = createContext(null);

/**
 * AppModeProvider Component
 * Wraps the entire app to provide global app_mode state
 */
export function AppModeProvider({ children }) {
  const [appMode, setAppMode] = useState(() => {
    // Initialize from localStorage if available
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem("app_mode");
      return saved || "client"; // Default to client mode
    }
    return "client";
  });
  
  // Persist to localStorage whenever appMode changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem("app_mode", appMode);
    }
  }, [appMode]);
  
  return (
    <AppModeContext.Provider value={{ appMode, setAppMode }}>
      {children}
    </AppModeContext.Provider>
  );
}

/**
 * Custom Hook - useAppMode
 * Use this in any component to access or modify app mode
 * 
 * USAGE EXAMPLES:
 * const { appMode, setAppMode } = useAppMode();
 * 
 * // Check current mode
 * if (appMode === "driver") { ... }
 * 
 * // Switch to driver mode
 * setAppMode("driver");
 */
export function useAppMode() {
  const context = useContext(AppModeContext);
  
  if (!context) {
    throw new Error(
      "useAppMode must be used within <AppModeProvider>. " +
      "Make sure your App.jsx wraps content with <AppModeProvider>"
    );
  }
  
  return context;
}
