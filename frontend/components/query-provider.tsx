'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// ── Global Cache Tuning ──────────────────────────────────────
// staleTime: Data won't automatically refetch if navigated back within 5 minutes
// gcTime:    Keep inactive data in memory for 30 minutes before garbage collecting
const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            staleTime: 1000 * 60 * 5,      // 5 minutes
            gcTime: 1000 * 60 * 30,         // 30 minutes
            refetchOnWindowFocus: false,     // Don't spam backend on tab switch
            retry: 1,                        // Single retry on failure
        },
    },
});

export default function QueryProvider({ children }: { children: React.ReactNode }) {
    return (
        <QueryClientProvider client={queryClient}>
            {children}
        </QueryClientProvider>
    );
}
