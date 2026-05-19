import type { DriverState } from '@/types/driver'
import type { DeliveryStatus } from '@/types/delivery'
import type { AnomalyAlert, AnomalyType } from '@/types/hub'
import { APP_CONFIG } from '@/config/app.config'
import { useLiveStore } from '@/store/liveStore'
import { useFocusStore } from '@/store/focusStore'
import { DAMASCUS_ROUTES } from '@/constants/mockRoutes'

function pick<T>(arr: readonly T[]): T {
    return arr[Math.floor(Math.random() * arr.length)]
}

function distanceBetween(a: [number, number], b: [number, number]): number {
    const R = 6371000
    const toRad = (d: number) => (d * Math.PI) / 180
    const dLat = toRad(b[0] - a[0])
    const dLng = toRad(b[1] - a[1])
    const x = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a[0])) * Math.cos(toRad(b[0])) * Math.sin(dLng / 2) ** 2
    return R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x))
}

function routeRemainingDistance(routeIdx: number, pointIndex: number): number {
    const route = DAMASCUS_ROUTES[routeIdx]
    if (!route || pointIndex >= route.length) return 0
    let dist = 0
    for (let i = pointIndex; i < route.length - 1; i++) {
        dist += distanceBetween(route[i], route[i + 1])
    }
    return dist
}

const AVG_SPEED_MPS = APP_CONFIG.mock.avgSpeedMps // ~30 km/h Damascus city driving

export function startMockEmitter(): () => void {
    const driverIds = Object.keys(useLiveStore.getState().drivers)
    const deliveryIds = Object.keys(useLiveStore.getState().deliveries)
    const statuses: DeliveryStatus[] = ['InTransit', 'Delivered', 'Assigned']
    const reasons = APP_CONFIG.mock.anomalyReasons
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
            useLiveStore.setState((s) => ({
                drivers: {
                    ...s.drivers,
                    [id]: { ...s.drivers[id], pointIndex: nextIdx } as DriverState,
                },
            }))
        }
    }, APP_CONFIG.mock.positionTickMs)

    // ETA recalculation — every 2s based on remaining route distance
    const etaInterval = setInterval(() => {
        const { drivers } = useLiveStore.getState()
        const focusId = useFocusStore.getState().focusedDeliveryId

        for (const [delId, del] of Object.entries(useLiveStore.getState().deliveries)) {
            if (del.status !== 'InTransit' || !del.assignedDriverId) continue
            const driver = drivers[del.assignedDriverId] as DriverState | undefined
            if (!driver) continue

            const remaining = routeRemainingDistance(driver.routeIndex, driver.pointIndex)
            const eta = Math.round(remaining / AVG_SPEED_MPS)

            if (delId === focusId) {
                useFocusStore.getState().setEta(eta)
            }
            useLiveStore.getState().patchDelivery(delId, { etaSeconds: eta })
        }
    }, APP_CONFIG.mock.etaTickMs)

    // Delivery patch — every 10s
    const delInterval = setInterval(() => {
        const id = pick(deliveryIds)
        useLiveStore.getState().patchDelivery(id, { status: pick(statuses) })
    }, APP_CONFIG.mock.deliveryPatchMs)

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
    }, APP_CONFIG.mock.anomalyInjectMs)

    return () => {
        clearInterval(posInterval)
        clearInterval(etaInterval)
        clearInterval(delInterval)
        clearInterval(anomInterval)
    }
}