import DevDisabled from '@/components/shared/DevDisabled'
import { isPageEnabled } from '@/config/devPages'

export default function AlertsPage() {
    if (!isPageEnabled('alerts')) {
        return <DevDisabled title="Alerts" />
    }

    return <h1 className="p-6 text-2xl font-semibold">Alerts</h1>
}