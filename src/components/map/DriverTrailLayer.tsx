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
    const trails = useLiveStore((s) => s.trails)
    const drivers = useLiveStore((s) => s.drivers)

    if (!trailEnabled) return null

    // Show trail for the focused driver, or whichever is currently selected
    const activeId = focusedDriverId ?? selectedDriverId
    if (!activeId) return null

    const trail = trails[activeId]
    if (!trail || trail.length < 2) return null

    const driver = drivers[activeId]
    const color = driver ? driverColor(driver.status, driver.stalledSince !== null) : '#3b82f6'

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
