import { createBrowserRouter } from 'react-router-dom'
import AppShell from '@/components/layout/AppShell'
import LiveOpsPage from '@/features/live-ops/LiveOpsPage'
import AnalyticsPage from '@/features/analytics/AnalyticsPage'
import DeliveriesPage from '@/features/deliveries/DeliveriesPage'
import AlertsPage from '@/features/alerts/AlertsPage'
import DriversPage from '@/features/drivers/DriversPage'
import SettingsPage from '@/features/settings/SettingsPage'

export const router = createBrowserRouter([
    {
        path: '/',
        element: <AppShell />,
        children: [
            { index: true, element: <LiveOpsPage /> },
            { path: 'analytics', element: <AnalyticsPage /> },
            { path: 'deliveries', element: <DeliveriesPage /> },
            { path: 'alerts', element: <AlertsPage /> },
            { path: 'drivers', element: <DriversPage /> },
            { path: 'settings', element: <SettingsPage /> },
        ],
    },
])