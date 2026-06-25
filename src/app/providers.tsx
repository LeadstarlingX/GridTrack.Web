import { useEffect } from 'react'
import { ClerkProvider, ClerkLoading, ClerkLoaded, SignedIn, useAuth } from '@clerk/clerk-react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ThemeProvider } from 'next-themes'
import { Toaster } from '@/components/ui/sonner'
import { APP_CONFIG } from '@/config/app.config'
import { setAuthBridge } from '@/lib/api/authBridge'

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            staleTime: APP_CONFIG.query.staleTimeMs,
            retry: APP_CONFIG.query.retry,
            refetchOnWindowFocus: APP_CONFIG.query.refetchOnWindowFocus,
        },
    },
})

function TokenBridge() {
    const { getToken, signOut } = useAuth()
    useEffect(() => {
        setAuthBridge({ getToken, signOut })
    }, [getToken, signOut])
    return null
}

function AppLoadingScreen() {
    return (
        <div className="flex h-screen w-screen items-center justify-center bg-[hsl(var(--background))] text-[hsl(var(--foreground))]">
            <div className="flex flex-col items-center gap-4">
                {/* Your favicon/logo */}
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="40"
                    height="38"
                    fill="none"
                    viewBox="0 0 48 46"
                    className="animate-pulse text-[hsl(var(--primary))]"
                >
                    <path
                        fill="currentColor"
                        d="M25.946 44.938c-.664.845-2.021.375-2.021-.698V33.937a2.26 2.26 0 0 0-2.262-2.262H10.287c-.92 0-1.456-1.04-.92-1.788l7.48-10.471c1.07-1.497 0-3.578-1.842-3.578H1.237c-.92 0-1.456-1.04-.92-1.788L10.013.474c.214-.297.556-.474.92-.474h28.894c.92 0 1.456 1.04.92 1.788l-7.48 10.471c-1.07 1.498 0 3.579 1.842 3.579h11.377c.943 0 1.473 1.088.89 1.83L25.947 44.94z"
                    />
                </svg>
                <div className="flex items-center gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-[hsl(var(--primary))] animate-pulse" />
                    <div className="h-1.5 w-1.5 rounded-full bg-[hsl(var(--primary))] animate-pulse [animation-delay:150ms]" />
                    <div className="h-1.5 w-1.5 rounded-full bg-[hsl(var(--primary))] animate-pulse [animation-delay:300ms]" />
                </div>
            </div>
        </div>
    )
}

export function Providers({ children }: { children: React.ReactNode }) {
    return (
        <ClerkProvider publishableKey={import.meta.env.VITE_CLERK_PUBLISHABLE_KEY} signInUrl="/sign-in">
            <ThemeProvider attribute="class" defaultTheme="system" enableSystem storageKey="gridtrack-theme">
                <QueryClientProvider client={queryClient}>
                    <ClerkLoading>
                        <AppLoadingScreen />
                    </ClerkLoading>
                    <ClerkLoaded>
                        <SignedIn>
                            <TokenBridge />
                        </SignedIn>
                        {children}
                    </ClerkLoaded>
                    <Toaster position="top-center" duration={3500} visibleToasts={3} />
                </QueryClientProvider>
            </ThemeProvider>
        </ClerkProvider>
    )
}