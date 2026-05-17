import DevDisabled from '@/components/shared/DevDisabled'
import { isPageEnabled } from '@/config/devPages'

export default function DeliveriesPage() {
    if (!isPageEnabled('deliveries')) {
        return <DevDisabled title="Deliveries" />
    }

    return <h1 className="p-6 text-2xl font-semibold">Deliveries</h1>
}