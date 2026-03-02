import { QueryClient } from "@tanstack/react-query";

/**
 * Central QueryClient for cache-first UX (Yandex-like instant screens).
 * Tune defaults here once; all pages benefit.
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Avoid refetch-on-every-navigation
      staleTime: 5 * 60 * 1000,   // 5 min
      gcTime: 60 * 60 * 1000,     // 1 hour (formerly cacheTime)
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});
