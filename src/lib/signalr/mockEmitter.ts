import type { DriverState } from '@/types/driver'
import type { DeliveryStatus } from '@/types/delivery'
import type { AnomalyAlert, AnomalyType } from '@/types/hub'
import { useLiveStore } from '@/store/liveStore'
import { DAMASCUS_ROUTES } from '@/constants/mockRoutes'

function pick<T>(arr: T[]): T {
    return arr[Math.floor(Math.random() * arr.length)]
}

export function startMockEmitter(): () => void {
    const driverIds = Object.keys(useLiveStore.getState().drivers)
    const deliveryIds = Object.keys(useLiveStore.getState().deliveries)
    const statuses: DeliveryStatus[] = ['InTransit', 'Delivered', 'Assigned']
    const reasons = ['Stalled for 3 min', 'Rerouting unexpectedly', 'Delivery delayed by 8 min']
    const anomalyTypes: AnomalyType[] = ['Stall', 'RouteDeviation', 'Delay']

    // Position tick — every 1s
    const posInterval = setInterval(() => {
        const { drivers } = useLiveStore.getState()
        for (const id of driverIds) {
            const d = drivers[id] as DriverState | undefined
            if (!d) continue
            const route = DAMASCUS_ROUTES[d.routeIndex]
            const nextIdx = (d.pointIndex + 1) % route.length
            const [lat, lng] = route[nextIdx]
            useLiveStore.getState().updateDriverPosition(id, lat, lng, d.districtId)

            // Also update pointIndex locally (not in store type, use direct patch)
            useLiveStore.setState((s) => ({
                drivers: {
                    ...s.drivers,
                    [id]: { ...s.drivers[id], pointIndex: nextIdx } as DriverState,
                },
            }))
        }
    }, 1000)

    // Delivery patch — every 10s
    const delInterval = setInterval(() => {
        const id = pick(deliveryIds)
        useLiveStore.getState().patchDelivery(id, { status: pick(statuses) })
    }, 10000)

    // Anomaly — every 15s
    const anomInterval = setInterval(() => {
        const driverId = pick(driverIds)
        const driver = useLiveStore.getState().drivers[driverId]
        if (!driver) return
        const alert: AnomalyAlert = {
            id: `anom-${Date.now()}`,
            deliveryId: pick(deliveryIds),
            driverId,
            driverName: driver.name,
            anomalyType: pick(anomalyTypes),
            reason: pick(reasons),
            districtId: driver.districtId,
            lat: driver.lat,
            lng: driver.lng,
            timestamp: new Date().toISOString(),
        }
        useLiveStore.getState().pushAnomaly(alert)
    }, 15000)

    return () => {
        clearInterval(posInterval)
        clearInterval(delInterval)
        clearInterval(anomInterval)
    }
}