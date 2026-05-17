import DevDisabled from '@/components/shared/DevDisabled'
import { isPageEnabled } from '@/config/devPages'

export default function AnalyticsPage() {
    if (!isPageEnabled('analytics')) {
        return <DevDisabled title="Analytics" />
    }

    return <h1 className="p-6 text-2xl font-semibold">Analytics</h1>
}