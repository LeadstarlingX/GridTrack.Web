import { Polyline } from 'react-leaflet'
import { useLiveStore } from '@/store/liveStore'
import { useFocusStore } from '@/store/focusStore'
import { useMapStore } from '@/store/mapStore'

function statusColor(status: string, isStalled: boolean): string {
    if (isStalled) return '#f97316'
    if (status === 'available') return '#22c55e'
    if (status === 'offline') return '#94a3b8'
    return '#3b82f6'
}

export default function DriverTrailLayer() {
    const trailEnabled = useMapStore((s) => s.trailEnabled)
    const trails = useLiveStore((s) => s.trails)
    const drivers = useLiveStore((s) => s.drivers)
    const focusedDriverId = useFocusStore((s) => s.focusedDriverId)

    return (
        <>
            {Object.entries(trails).map(([id, points]) => {
                if (points.length < 2) return null
                const driver = drivers[id]
                if (!driver) return null

                const isFocused = id === focusedDriverId
                const isDimmed = focusedDriverId !== null && !isFocused
                // Always show focused driver's trail; hide others when toggle is off
                if (!trailEnabled && !isFocused) return null
                const color = statusColor(driver.status, driver.stalledSince !== null)

                const n = points.length
                return points.slice(1).map((_, segIdx) => {
                    const ratio = (segIdx + 1) / (n - 1)
                    const opacity = isDimmed ? 0.1 : 0.15 + ratio * 0.6
                    return (
                        <Polyline
                            key={`${id}-seg-${segIdx}`}
                            positions={[points[segIdx], points[segIdx + 1]]}
                            pathOptions={{
                                color,
                                weight: isFocused ? 3 : 2,
                                opacity,
                                lineCap: 'round',
                                lineJoin: 'round',
                            }}
                        />
                    )
                })
            })}
        </>
    )
}
