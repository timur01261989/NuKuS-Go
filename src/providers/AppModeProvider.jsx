import React, { createContext, useContext, useState, useEffect } from 'react';

const AppModeContext = createContext(null);

export function AppModeProvider({ children }) {
  const [appMode, setAppModeState] = useState('client');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('app_mode');
      if (stored && ['client', 'driver'].includes(stored)) {
        setAppModeState(stored);
      } else {
        setAppModeState('client');
      }
    } catch (e) {
      console.warn('Failed to read app_mode:', e);
      setAppModeState('client');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const setAppMode = (newMode) => {
    if (!['client', 'driver'].includes(newMode)) {
      console.warn(`Invalid app mode: ${newMode}`);
      return;
    }
    setAppModeState(newMode);
    try {
      localStorage.setItem('app_mode', newMode);
    } catch (e) {
      console.warn('Failed to save app_mode:', e);
    }
  };

  return (
    <AppModeContext.Provider value={{ appMode, setAppMode, isLoading }}>
      {children}
    </AppModeContext.Provider>
  );
}

export function useAppMode() {
  const context = useContext(AppModeContext);
  if (!context) {
    throw new Error('useAppMode must be used within AppModeProvider');
  }
  return context;
}
