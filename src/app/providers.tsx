import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ThemeProvider } from 'next-themes'
import { Toaster } from '@/components/ui/sonner'
import { APP_CONFIG } from '@/config/app.config'

export const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            staleTime:            APP_CONFIG.query.staleTimeMs,
            retry:                APP_CONFIG.query.retry,
            refetchOnWindowFocus: APP_CONFIG.query.refetchOnWindowFocus,
        },
    },
})

export function Providers({ children }: { children: React.ReactNode }) {
    return (
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem storageKey="gridtrack-theme">
            <QueryClientProvider client={queryClient}>
                {children}
                <Toaster position="top-center" duration={3500} visibleToasts={3} />
            </QueryClientProvider>
        </ThemeProvider>
    )
}