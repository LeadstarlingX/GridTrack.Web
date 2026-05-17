import { ClerkProvider } from '@clerk/clerk-react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ThemeProvider } from 'next-themes'
import { Toaster } from '@/components/ui/sonner'

const queryClient = new QueryClient()

export function Providers({ children }: { children: React.ReactNode }) {
    return (
        <ClerkProvider publishableKey={import.meta.env.VITE_CLERK_PUBLISHABLE_KEY}>
            <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
                <QueryClientProvider client={queryClient}>
                    {children}
                    <Toaster position="top-right" />
                </QueryClientProvider>
            </ThemeProvider>
        </ClerkProvider>
    )
}