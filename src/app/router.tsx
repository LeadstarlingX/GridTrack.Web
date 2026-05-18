import { createBrowserRouter } from 'react-router-dom'
import AppShell from '@/components/layout/AppShell'
import LiveOpsPage from '@/features/live-ops/LiveOpsPage'
import AnalyticsPage from '@/features/analytics/AnalyticsPage'
import DeliveriesPage from '@/features/deliveries/DeliveriesPage'
import AlertsPage from '@/features/alerts/AlertsPage'
import DriversPage from '@/features/drivers/DriversPage'
import SettingsPage from '@/features/settings/SettingsPage'
import { PageGuard } from '@/components/PageGuard'

export const router = createBrowserRouter([
    {
        path: '/',
        element: <AppShell />,
        children: [
            {
                index: true,
                element: (
                    <PageGuard pageKey="liveOps">
                        <LiveOpsPage />
                    </PageGuard>
                ),
            },
            {
                path: 'analytics',
                element: (
                    <PageGuard pageKey="analytics">
                        <AnalyticsPage />
                    </PageGuard>
                ),
            },
            {
                path: 'deliveries',
                element: (
                    <PageGuard pageKey="deliveries">
                        <DeliveriesPage />
                    </PageGuard>
                ),
            },
            {
                path: 'alerts',
                element: (
                    <PageGuard pageKey="alerts">
                        <AlertsPage />
                    </PageGuard>
                ),
            },
            {
                path: 'drivers',
                element: (
                    <PageGuard pageKey="drivers">
                        <DriversPage />
                    </PageGuard>
                ),
            },
            {
                path: 'settings',
                element: (
                    <PageGuard pageKey="settings">
                        <SettingsPage />
                    </PageGuard>
                ),
            },
        ],
    },
])