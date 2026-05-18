import { ClerkProvider, ClerkLoading, ClerkLoaded, SignedIn, SignedOut, RedirectToSignIn } from '@clerk/clerk-react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ThemeProvider } from 'next-themes'
import { Toaster } from '@/components/ui/sonner'

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            staleTime: 60 * 1000,        // data is fresh for 60s — no background refetch
            retry: 1,                     // fail fast, don't retry 3 times by default
            refetchOnWindowFocus: false,  // don't refetch when user alt-tabs back
        },
    },
})

function AppLoadingScreen() {
    return (
        <div className="flex h-screen w-screen items-center justify-center bg-background">
            <div className="flex flex-col items-center gap-4">
                {/* Your favicon/logo */}
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="40"
                    height="38"
                    fill="none"
                    viewBox="0 0 48 46"
                    className="animate-pulse"
                >
                    <path
                        fill="#863bff"
                        d="M25.946 44.938c-.664.845-2.021.375-2.021-.698V33.937a2.26 2.26 0 0 0-2.262-2.262H10.287c-.92 0-1.456-1.04-.92-1.788l7.48-10.471c1.07-1.497 0-3.578-1.842-3.578H1.237c-.92 0-1.456-1.04-.92-1.788L10.013.474c.214-.297.556-.474.92-.474h28.894c.92 0 1.456 1.04.92 1.788l-7.48 10.471c-1.07 1.498 0 3.579 1.842 3.579h11.377c.943 0 1.473 1.088.89 1.83L25.947 44.94z"
                    />
                </svg>
                <div className="flex items-center gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-primary animate-bounce [animation-delay:0ms]" />
                    <div className="h-1.5 w-1.5 rounded-full bg-primary animate-bounce [animation-delay:150ms]" />
                    <div className="h-1.5 w-1.5 rounded-full bg-primary animate-bounce [animation-delay:300ms]" />
                </div>
            </div>
        </div>
    )
}

export function Providers({ children }: { children: React.ReactNode }) {
    return (
        <ClerkProvider publishableKey={import.meta.env.VITE_CLERK_PUBLISHABLE_KEY}>
            <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
                <QueryClientProvider client={queryClient}>
                    <ClerkLoading>
                        <AppLoadingScreen />
                    </ClerkLoading>
                    <ClerkLoaded>
                        <SignedIn>{children}</SignedIn>
                        <SignedOut><RedirectToSignIn /></SignedOut>
                    </ClerkLoaded>
                    <Toaster position="top-right" />
                </QueryClientProvider>
            </ThemeProvider>
        </ClerkProvider>
    )
}