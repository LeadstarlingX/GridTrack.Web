import { Polyline } from 'react-leaflet'
import { useLiveStore } from '@/store/liveStore'
import { useMapStore } from '@/store/mapStore'

export default function DeliveryRoutesLayer() {
    const routesEnabled = useMapStore((s) => s.routesEnabled)
    const drivers = useLiveStore((s) => s.drivers)
    const deliveries = useLiveStore((s) => s.deliveries)
    const driverRoutes = useLiveStore((s) => s.driverRoutes)

    if (!routesEnabled) return null

    const inTransitDriverIds = new Set(
        Object.values(deliveries)
            .filter((d) => d.status === 'InTransit' && d.assignedDriverId)
            .map((d) => d.assignedDriverId!),
    )

    return (
        <>
            {Object.entries(driverRoutes).map(([driverId, polyline]) => {
                if (!inTransitDriverIds.has(driverId)) return null
                if (!polyline || polyline.length < 2) return null
                const driver = drivers[driverId]
                const start: [number, number] = driver ? [driver.lat, driver.lng] : polyline[0]
                const path: [number, number][] = [start, ...polyline.slice(1)]
                return (
                    <Polyline
                        key={driverId}
                        positions={path}
                        pathOptions={{
                            color: '#3b82f6',
                            weight: 2.5,
                            opacity: 0.65,
                            dashArray: '7 5',
                        }}
                        interactive={false}
                    />
                )
            })}
        </>
    )
}
