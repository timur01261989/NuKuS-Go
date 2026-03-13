import React from "react";
import QueryProvider from "./QueryProvider.jsx";
import { AuthProvider } from "./AuthProvider.jsx";
import { AppModeProvider } from "./AppModeProvider.jsx";
import { DispatchProvider } from "./DispatchProvider.jsx";
import { RealtimeProvider } from "./RealtimeProvider.jsx";
import { LanguageProvider } from "./LanguageProvider.jsx";

function AppProvidersComponent({ children }) {
  return (
    <AuthProvider>
      <LanguageProvider>
        <AppModeProvider>
          <QueryProvider>
            <RealtimeProvider>
              <DispatchProvider>{children}</DispatchProvider>
            </RealtimeProvider>
          </QueryProvider>
        </AppModeProvider>
      </LanguageProvider>
    </AuthProvider>
  );
}

const AppProviders = React.memo(AppProvidersComponent);

export default AppProviders;
