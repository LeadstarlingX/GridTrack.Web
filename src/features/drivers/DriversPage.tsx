import DevDisabled from '@/components/shared/DevDisabled'
import { isPageEnabled } from '@/config/devPages'

export default function DriversPage() {
    if (!isPageEnabled('drivers')) {
        return <DevDisabled title="Drivers" />
    }

    return <h1 className="p-6 text-2xl font-semibold">Drivers</h1>
}