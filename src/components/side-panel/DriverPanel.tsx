import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useMapStore } from '@/store/mapStore'
import { useLiveStore } from '@/store/liveStore'
import { useFocusStore } from '@/store/focusStore'
import { DAMASCUS_ROUTES } from '@/constants/mockRoutes'

function useStallTimer(stalledSince: string | null) {
    const [elapsed, setElapsed] = useState(0)
    useEffect(() => {
        if (!stalledSince) { setElapsed(0); return }
        const tick = () => setElapsed(Math.floor((Date.now() - new Date(stalledSince).getTime()) / 1000))
        tick()
        const id = setInterval(tick, 1000)
        return () => clearInterval(id)
    }, [stalledSince])
    if (!stalledSince) return null
    const m = Math.floor(elapsed / 60), s = elapsed % 60
    return m > 0 ? `${m}m ${s}s` : `${s}s`
}

export default function DriverPanel() {
    const driverId = useMapStore((s) => s.selectedDriverId)
    const setMode = useMapStore((s) => s.setSidePanelMode)
    const driver = useLiveStore((s) => s.drivers[driverId ?? ''])

    if (!driver) return null

    const stallTimer = useStallTimer(driver.stalledSince ?? null)
    const statusColor = driver.status === 'in-transit' ? 'default' : driver.status === 'available' ? 'secondary' : 'outline'

    const deliveries = Object.values(useLiveStore.getState().deliveries)
    const activeDelivery = deliveries.find((d) => d.assignedDriverId === driver.id && d.status === 'InTransit')
    const canFollow = Boolean(activeDelivery)

    const handleFollow = () => {
        if (!activeDelivery) return
        const routeIdx = (driver as any).routeIndex ?? 0
        const polyline = DAMASCUS_ROUTES[routeIdx] ?? []
        useFocusStore.getState().enterFocusMode(activeDelivery.id, driver.id, polyline, activeDelivery.etaSeconds ?? 420)
        setMode('focus')
    }

    return (
        <div className="p-4">
            <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-lg">{driver.name}</h2>
                <Button variant="ghost" size="icon" onClick={() => setMode('idle')}>
                    <X className="h-4 w-4" />
                </Button>
            </div>
            {stallTimer && (
                <div className="mb-3 flex items-center gap-2 rounded-lg border border-orange-500/30 bg-orange-500/10 px-3 py-2">
                    <span className="inline-block h-2 w-2 rounded-full bg-orange-500 animate-pulse" />
                    <span className="text-xs font-semibold text-orange-500">Stalled · {stallTimer}</span>
                </div>
            )}
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
                <Button className="w-full mt-4" onClick={handleFollow} disabled={!canFollow}>
                    {canFollow ? 'Follow Driver' : 'No Active Delivery'}
                </Button>
            </div>
        </div>
    )
}