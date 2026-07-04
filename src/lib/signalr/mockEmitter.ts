import type { DriverState } from '@/types/driver'
import type { DeliveryStatus } from '@/types/delivery'
import type { AnomalyAlert, AnomalyType, DemandSurge, AnomalyIncident } from '@/types/hub'
import { APP_CONFIG } from '@/config/app.config'
import { useLiveStore } from '@/store/liveStore'
import { toEtaDeadline } from '@/lib/eta'
import { DAMASCUS_ROUTES } from '@/constants/mockRoutes'
// import {useFocusStore} from "@/store";

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

const AVG_SPEED_MPS = APP_CONFIG.mock.avgSpeedMps

const SURGE_DISTRICTS = [
    'district-1', 'district-2', 'district-3', 'district-4',
    'district-5', 'district-6', 'district-7', 'district-8',
]

const INCIDENT_SUMMARIES: string[] = [
    'Cluster of stale positions detected in residential zone',
    'Multiple ETA breaches on main corridor — possible congestion',
    'Route deviations spiking near checkpoint area',
    'Unexpected stops following major delivery wave in district',
    'AI flagged anomaly cluster — review dispatch queue',
    'Driver grouping detected, possible road blockage ahead',
    'Unusual stop pattern detected near commercial zone',
    'Surge of unresolved ETA alerts — auto-escalated',
    'High anomaly density — district approaching incident threshold',
    'Cascading delays spreading from arterial road blockage',
]

const ANOMALY_REASONS: string[] = [
    'No movement for over 12 minutes',
    'Driver left assigned delivery corridor',
    'ETA exceeded by 22 minutes — peak-hour traffic',
    'Vehicle stopped in non-delivery zone for 9 minutes',
    'Stale GPS — no position update for 18 minutes',
    'Route deviation detected near checkpoint',
    'Unexpected stop in residential area',
    'ETA missed — arterial road congestion flagged by AI',
    'Multiple micro-stops indicating possible vehicle issue',
    'Delivery zone loop detected — possible navigation error',
]

// Realistic delivery lifecycle: transitions that make sense
const LIFECYCLE_TRANSITIONS: Partial<Record<DeliveryStatus, DeliveryStatus[]>> = {
    Created:   ['Assigned'],
    Assigned:  ['InTransit'],
    InTransit: ['Delivered', 'Anomalous'],
    Anomalous: ['InTransit', 'Delivered'],
}

function nextDeliveryStatus(current: DeliveryStatus): DeliveryStatus {
    const options = LIFECYCLE_TRANSITIONS[current]
    if (!options) return current
    return pick(options)
}

export function startMockEmitter(): () => void {
    const driverIds = Object.keys(useLiveStore.getState().drivers)
    const deliveryIds = Object.keys(useLiveStore.getState().deliveries)
    const anomalyTypes: AnomalyType[] = ['StalePosition', 'RouteDeviation', 'EtaExceeded', 'UnexpectedStop']

    const stalledDrivers = new Set<string>()

    // Position tick — every 1s
    const posInterval = setInterval(() => {
        const { drivers } = useLiveStore.getState()
        for (const id of driverIds) {
            if (stalledDrivers.has(id)) continue
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

    // ETA recalculation — every 2s
    const etaInterval = setInterval(() => {
        const { drivers } = useLiveStore.getState()
        // const focusId = useFocusStore.getState().focusedDeliveryId

        for (const [delId, del] of Object.entries(useLiveStore.getState().deliveries)) {
            if (del.status !== 'InTransit' || !del.assignedDriverId) continue
            const driver = drivers[del.assignedDriverId] as DriverState | undefined
            if (!driver) continue

            const remaining = routeRemainingDistance(driver.routeIndex, driver.pointIndex)
            const eta = Math.round(remaining / AVG_SPEED_MPS)

            useLiveStore.getState().patchDelivery(delId, { etaDeadline: toEtaDeadline(eta) })
        }
    }, APP_CONFIG.mock.etaTickMs)

    // Delivery lifecycle — every 8s (more frequent than before, more realistic transitions)
    const delInterval = setInterval(() => {
        const deliveries = useLiveStore.getState().deliveries
        // Pick an active delivery (not yet delivered/cancelled)
        const active = deliveryIds.filter((id) => {
            const s = deliveries[id]?.status
            return s === 'Created' || s === 'Assigned' || s === 'InTransit' || s === 'Anomalous'
        })
        if (active.length === 0) return
        const id = pick(active)
        const current = deliveries[id]?.status ?? 'Created'
        useLiveStore.getState().patchDelivery(id, { status: nextDeliveryStatus(current) })
    }, 8_000)

    // Anomaly injection — every 12s (slightly faster for more events)
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
            reason: pick(ANOMALY_REASONS),
            districtId: driver.districtId,
            lat: driver.lat,
            lng: driver.lng,
            timestamp: new Date().toISOString(),
        }
        useLiveStore.getState().pushAnomaly(alert)
    }, 12_000)

    // Stall simulation — only stall drivers actively delivering (InTransit), auto-clear after pause
    const stallInterval = setInterval(() => {
        const { deliveries } = useLiveStore.getState()
        const inTransitDriverIds = new Set(
            Object.values(deliveries)
                .filter((d) => d.status === 'InTransit' && d.assignedDriverId != null)
                .map((d) => d.assignedDriverId!),
        )
        const eligible = driverIds.filter((id) => !stalledDrivers.has(id) && inTransitDriverIds.has(id))
        if (eligible.length === 0) return
        const driverId = pick(eligible)
        stalledDrivers.add(driverId)
        useLiveStore.getState().markStall(driverId, new Date().toISOString())

        const duration = 12_000 + Math.floor(Math.random() * 8_000)
        setTimeout(() => {
            stalledDrivers.delete(driverId)
            const d = useLiveStore.getState().drivers[driverId]
            if (d) {
                useLiveStore.getState().updateDriverPosition(driverId, d.lat + 0.00005, d.lng + 0.00005, d.districtId)
            }
        }, duration)
    }, 20_000)

    // Demand Surge — every 25s with more district coverage and varied σ
    const surgeInterval = setInterval(() => {
        const districtId = pick(SURGE_DISTRICTS)
        const mean = 7 + Math.floor(Math.random() * 8)
        const current = mean + Math.floor(Math.random() * 14) + 4
        const deviations = Number(((current - mean) / Math.max(1, mean * 0.22)).toFixed(2))
        const surge: DemandSurge = {
            districtId,
            currentCount: current,
            historicalMean: mean,
            deviations,
            detectedAt: new Date().toISOString(),
        }
        useLiveStore.getState().pushSurge(surge)
    }, 25_000)

    // Anomaly Incident — every 45s with varied window sizes
    const incidentInterval = setInterval(() => {
        const districtId = pick(SURGE_DISTRICTS)
        const count = 3 + Math.floor(Math.random() * 6)
        const incident: AnomalyIncident = {
            districtId,
            anomalyCount: count,
            windowMinutes: pick([5, 10, 15, 30] as const),
            summary: pick(INCIDENT_SUMMARIES),
            detectedAt: new Date().toISOString(),
        }
        useLiveStore.getState().pushIncident(incident)
    }, 45_000)

    return () => {
        clearInterval(posInterval)
        clearInterval(etaInterval)
        clearInterval(delInterval)
        clearInterval(anomInterval)
        clearInterval(stallInterval)
        clearInterval(surgeInterval)
        clearInterval(incidentInterval)
    }
}
