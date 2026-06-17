import { useCallback } from 'react'
import { Polyline } from 'react-leaflet'
import { useLiveStore } from '@/store/liveStore'
import { useFocusStore } from '@/store/focusStore'
import { useMapStore } from '@/store/mapStore'

function driverColor(status: string, isStalled: boolean): string {
    if (isStalled) return '#f97316'
    if (status === 'available') return '#22c55e'
    if (status === 'offline') return '#94a3b8'
    return '#3b82f6'
}

export default function DriverTrailLayer() {
    const trailEnabled = useMapStore((s) => s.trailEnabled)
    const selectedDriverId = useMapStore((s) => s.selectedDriverId)
    const focusedDriverId = useFocusStore((s) => s.focusedDriverId)
    const activeId = focusedDriverId ?? selectedDriverId

    // Narrow selectors: only re-render when the active driver's specific data changes,
    // not on every position batch for all drivers.
    const trail = useLiveStore(useCallback((s) =>
        activeId ? s.trails[activeId] : null,
    [activeId]))

    const color = useLiveStore(useCallback((s) => {
        if (!activeId) return '#3b82f6'
        const d = s.drivers[activeId]
        return d ? driverColor(d.status, d.stalledSince !== null) : '#3b82f6'
    }, [activeId]))

    if (!trailEnabled || !activeId || !trail || trail.length < 2) return null

    return (
        <Polyline
            positions={trail}
            pathOptions={{
                color,
                weight: 2.5,
                opacity: 0.7,
                dashArray: '6 4',
                lineCap: 'round',
                lineJoin: 'round',
            }}
        />
    )
}
