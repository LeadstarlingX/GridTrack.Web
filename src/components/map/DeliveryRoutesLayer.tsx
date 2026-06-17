import { memo } from 'react'
import { Polyline } from 'react-leaflet'
import { useShallow } from 'zustand/react/shallow'
import { useLiveStore } from '@/store/liveStore'
import { useMapStore } from '@/store/mapStore'

// One memoized polyline per in-transit driver. Re-renders only when THIS driver's
// position or route changes — not when any other driver moves.
const RoutePolyline = memo(function RoutePolyline({ driverId }: { driverId: string }) {
    const lat = useLiveStore((s) => s.drivers[driverId]?.lat)
    const lng = useLiveStore((s) => s.drivers[driverId]?.lng)
    const route = useLiveStore((s) => s.driverRoutes[driverId])

    if (!route || route.length < 2) return null

    const start: [number, number] = lat != null && lng != null ? [lat, lng] : route[0]
    const path: [number, number][] = [start, ...route.slice(1)]

    return (
        <Polyline
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
})

export default function DeliveryRoutesLayer() {
    const routesEnabled = useMapStore((s) => s.routesEnabled)

    // Parent subscribes only to the SET of in-transit driver ids (a delivery-status
    // concern), so it re-renders on assignment/completion — not on every position tick.
    const inTransitDriverIds = useLiveStore(useShallow((s) =>
        Object.values(s.deliveries)
            .filter((d) => d.status === 'InTransit' && d.assignedDriverId)
            .map((d) => d.assignedDriverId!),
    ))

    if (!routesEnabled) return null

    return (
        <>
            {inTransitDriverIds.map((id) => (
                <RoutePolyline key={id} driverId={id} />
            ))}
        </>
    )
}
