import { createBrowserRouter, Navigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import AppShell from '@/components/layout/AppShell'
import LiveOpsPage from '@/features/live-ops/LiveOpsPage'
import AnalyticsPage from '@/features/analytics/AnalyticsPage'
import PerformancePage from '@/features/analytics/PerformancePage'
import AssistantPage from '@/features/analytics/AssistantPage'
import DeliveriesPage from '@/features/deliveries/DeliveriesPage'
import CancelledOrdersPage from '@/features/deliveries/CancelledOrdersPage'
import AlertsPage from '@/features/alerts/AlertsPage'
import DriversPage from '@/features/drivers/DriversPage'
import SettingsPage from '@/features/settings/SettingsPage'
import SignInPage from '@/features/auth/SignInPage'
import { PageGuard } from '@/components/PageGuard'
import { ErrorBoundary } from '@/components/ErrorBoundary'

function AuthGuard({ children }: { children: React.ReactNode }) {
    const token = useAuthStore((s) => s.token)
    if (!token) return <Navigate to="/sign-in" replace />
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
            { index: true,          element: <ErrorBoundary><PageGuard pageKey="liveOps"><LiveOpsPage /></PageGuard></ErrorBoundary> },
            { path: 'analytics',    element: <ErrorBoundary><PageGuard pageKey="analytics"><AnalyticsPage /></PageGuard></ErrorBoundary> },
            { path: 'performance',  element: <ErrorBoundary><PageGuard pageKey="analytics"><PerformancePage /></PageGuard></ErrorBoundary> },
            { path: 'assistant',    element: <ErrorBoundary><PageGuard pageKey="analytics"><AssistantPage /></PageGuard></ErrorBoundary> },
            { path: 'deliveries',   element: <ErrorBoundary><PageGuard pageKey="deliveries"><DeliveriesPage /></PageGuard></ErrorBoundary> },
            { path: 'cancelled',    element: <ErrorBoundary><PageGuard pageKey="cancelled"><CancelledOrdersPage /></PageGuard></ErrorBoundary> },
            { path: 'alerts',       element: <ErrorBoundary><PageGuard pageKey="alerts"><AlertsPage /></PageGuard></ErrorBoundary> },
            { path: 'drivers',      element: <ErrorBoundary><PageGuard pageKey="drivers"><DriversPage /></PageGuard></ErrorBoundary> },
            { path: 'settings',     element: <ErrorBoundary><PageGuard pageKey="settings"><SettingsPage /></PageGuard></ErrorBoundary> },
        ],
    },
])