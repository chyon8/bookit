"use client";

import React, { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Data is considered fresh for 5 minutes
            staleTime: 5 * 60 * 1000,
            // Cache data for 10 minutes
            gcTime: 10 * 60 * 1000,
            // Refetch on window focus
            refetchOnWindowFocus: true,
            // Retry failed requests
            retry: 1,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}
