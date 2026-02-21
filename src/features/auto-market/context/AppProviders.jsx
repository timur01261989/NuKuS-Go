import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MarketProvider } from "./MarketContext";
import { CreateAdProvider } from "./CreateAdContext";
import { CompareProvider } from "./CompareContext";
import { AiProcessProvider } from "./AiProcessContext";

/**
 * Single wrapper to keep AutoMarketEntry clean.
 * IMPORTANT: Market/Compare/CreateAd order is preserved to avoid behavior changes.
 */
const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, refetchOnWindowFocus: false },
    mutations: { retry: 0 },
  },
});

export default function AppProviders({ children }) {
  return (
    <QueryClientProvider client={queryClient}>
      <MarketProvider>
        <CompareProvider>
          <AiProcessProvider>
            <CreateAdProvider>{children}</CreateAdProvider>
          </AiProcessProvider>
        </CompareProvider>
      </MarketProvider>
    </QueryClientProvider>
  );
}
