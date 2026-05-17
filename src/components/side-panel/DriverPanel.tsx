import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useMapStore } from '@/store/mapStore'
import { useLiveStore } from '@/store/liveStore'
import { useFocusStore } from '@/store/focusStore'

export default function DriverPanel() {
    const driverId = useMapStore((s) => s.selectedDriverId)
    const setMode = useMapStore((s) => s.setSidePanelMode)
    const driver = useLiveStore((s) => s.drivers[driverId ?? ''])
    const enterFocus = useFocusStore((s) => s.enterFocusMode)

    if (!driver) return null

    const statusColor = driver.status === 'in-transit' ? 'default' : driver.status === 'available' ? 'secondary' : 'outline'

    return (
        <div className="p-4">
            <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-lg">{driver.name}</h2>
                <Button variant="ghost" size="icon" onClick={() => setMode('idle')}>
                    <X className="h-4 w-4" />
                </Button>
            </div>
            <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                    <span className="text-muted-foreground">Status</span>
                    <Badge variant={statusColor}>{driver.status}</Badge>
                </div>
                <div className="flex justify-between">
                    <span className="text-muted-foreground">ID</span>
                    <span>{driver.id}</span>
                </div>
                <div className="flex justify-between">
                    <span className="text-muted-foreground">Position</span>
                    <span>{driver.lat.toFixed(4)}, {driver.lng.toFixed(4)}</span>
                </div>
                <Button
                    className="w-full mt-4"
                    onClick={() => {
                        enterFocus('del-1', driver.id, [], 420)
                        setMode('focus')
                    }}
                >
                    Follow Driver
                </Button>
            </div>
        </div>
    )
}