import { createBrowserRouter } from 'react-router-dom'
import AppShell from '@/components/layout/AppShell'
import LiveOpsPage from '@/features/live-ops/LiveOpsPage'
import AnalyticsPage from '@/features/analytics/AnalyticsPage'
import DeliveriesPage from '@/features/deliveries/DeliveriesPage'
import AlertsPage from '@/features/alerts/AlertsPage'
import DriversPage from '@/features/drivers/DriversPage'
import SettingsPage from '@/features/settings/SettingsPage'
import { PageGuard } from '@/components/PageGuard'
import { ErrorBoundary } from '@/components/ErrorBoundary'

export const router = createBrowserRouter([
    {
        path: '/',
        element: <AppShell />,
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
