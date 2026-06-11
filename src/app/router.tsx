import { createBrowserRouter, Navigate } from 'react-router-dom'
import { useAuth } from '@clerk/clerk-react'
import AppShell from '@/components/layout/AppShell'
import LiveOpsPage from '@/features/live-ops/LiveOpsPage'
import AnalyticsPage from '@/features/analytics/AnalyticsPage'
import DeliveriesPage from '@/features/deliveries/DeliveriesPage'
import AlertsPage from '@/features/alerts/AlertsPage'
import DriversPage from '@/features/drivers/DriversPage'
import SettingsPage from '@/features/settings/SettingsPage'
import SignInPage from '@/features/auth/SignInPage'
import { PageGuard } from '@/components/PageGuard'
import { ErrorBoundary } from '@/components/ErrorBoundary'

function AuthGuard({ children }: { children: React.ReactNode }) {
    const { isLoaded, isSignedIn } = useAuth()
    if (!isLoaded) return (
        <div className="flex h-screen w-screen items-center justify-center bg-[hsl(var(--background))]">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-[hsl(var(--primary))] border-t-transparent" />
        </div>
    )
    if (!isSignedIn) return <Navigate to="/sign-in" replace />
    return <>{children}</>
}

export const router = createBrowserRouter([
    {
        path: '/sign-in',
        element: <SignInPage />,
    },
    {
        path: '/',
        element: (
            <AuthGuard>
                <AppShell />
            </AuthGuard>
        ),
        children: [
            {
                index: true,
                element: (
                    <ErrorBoundary>
                        <PageGuard pageKey="liveOps">
                            <LiveOpsPage />
                        </PageGuard>
                    </ErrorBoundary>
                ),
            },
            {
                path: 'analytics',
                element: (
                    <ErrorBoundary>
                        <PageGuard pageKey="analytics">
                            <AnalyticsPage />
                        </PageGuard>
                    </ErrorBoundary>
                ),
            },
            {
                path: 'deliveries',
                element: (
                    <ErrorBoundary>
                        <PageGuard pageKey="deliveries">
                            <DeliveriesPage />
                        </PageGuard>
                    </ErrorBoundary>
                ),
            },
            {
                path: 'alerts',
                element: (
                    <ErrorBoundary>
                        <PageGuard pageKey="alerts">
                            <AlertsPage />
                        </PageGuard>
                    </ErrorBoundary>
                ),
            },
            {
                path: 'drivers',
                element: (
                    <ErrorBoundary>
                        <PageGuard pageKey="drivers">
                            <DriversPage />
                        </PageGuard>
                    </ErrorBoundary>
                ),
            },
            {
                path: 'settings',
                element: (
                    <ErrorBoundary>
                        <PageGuard pageKey="settings">
                            <SettingsPage />
                        </PageGuard>
                    </ErrorBoundary>
                ),
            },
        ],
    },
])
