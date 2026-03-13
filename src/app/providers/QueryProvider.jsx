import React from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/services/platform/queryClient";

function QueryProviderComponent({ children }) {
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}

const QueryProvider = React.memo(QueryProviderComponent);

export default QueryProvider;
