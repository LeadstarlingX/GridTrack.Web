import { create } from 'zustand'
import type { DriverState } from '@/types/driver'
import type { DeliveryState } from '@/types/delivery'
import type { AnomalyAlert, DemandSurge, AnomalyIncident } from '@/types/hub'
import { APP_CONFIG } from '@/config/app.config'

const TRAIL_MAX_POINTS = 40

interface LiveStore {
    drivers: Record<string, DriverState>
    deliveries: Record<string, DeliveryState>
    anomalyQueue: AnomalyAlert[]
    surgeAlerts: DemandSurge[]
    incidents: AnomalyIncident[]
    trails: Record<string, [number, number][]>
    driverRoutes: Record<string, [number, number][]>

    updateDriverPosition: (id: string, lat: number, lng: number, districtId: string, routeAhead?: [number, number][]) => void
    batchUpdateDriverPositions: (updates: Array<{ id: string; lat: number; lng: number; districtId: string; routeAhead?: [number, number][] | null }>) => void
    patchDelivery: (id: string, partial: Partial<DeliveryState>) => void
    pushAnomaly: (alert: AnomalyAlert) => void
    markStall: (id: string, stalledSince: string) => void
    pushSurge: (alert: DemandSurge) => void
    pushIncident: (incident: AnomalyIncident) => void
    initDrivers: (drivers: DriverState[]) => void
}

export const useLiveStore = create<LiveStore>()((set) => ({
    drivers: {},
    deliveries: {},
    anomalyQueue: [],
    surgeAlerts: [],
    incidents: [],
    trails: {},
    driverRoutes: {},

    updateDriverPosition: (id, lat, lng, districtId, routeAhead) =>
        set((s) => {
            const existing = s.drivers[id]
            const prevTrail = s.trails[id] ?? []
            const trail: [number, number][] = [...prevTrail, [lat, lng] as [number, number]].slice(-TRAIL_MAX_POINTS)
            const driverRoutes = routeAhead
                ? { ...s.driverRoutes, [id]: routeAhead }
                : routeAhead === null
                    ? { ...s.driverRoutes, [id]: [] }
                    : s.driverRoutes
            return {
                drivers: {
                    ...s.drivers,
                    [id]: existing
                        ? { ...existing, lat, lng, districtId, stalledSince: null }
                        : { id, name: id.slice(-8), lat, lng, districtId, status: 'in-transit' as const, routeIndex: 0, pointIndex: 0, stalledSince: null },
                },
                trails: { ...s.trails, [id]: trail },
                driverRoutes,
            }
        }),

    batchUpdateDriverPositions: (updates) => {
        performance.mark('gt-batch-start')
        set((s) => {
            const drivers = { ...s.drivers }
            const trails = { ...s.trails }
            const driverRoutes = { ...s.driverRoutes }
            for (const u of updates) {
                const existing = drivers[u.id]
                const prevTrail = trails[u.id] ?? []
                trails[u.id] = [...prevTrail, [u.lat, u.lng] as [number, number]].slice(-TRAIL_MAX_POINTS)
                drivers[u.id] = existing
                    ? { ...existing, lat: u.lat, lng: u.lng, districtId: u.districtId, stalledSince: null }
                    : { id: u.id, name: u.id.slice(-8), lat: u.lat, lng: u.lng, districtId: u.districtId, status: 'in-transit' as const, routeIndex: 0, pointIndex: 0, stalledSince: null }
                if (u.routeAhead !== undefined) {
                    driverRoutes[u.id] = u.routeAhead ?? []
                }
            }
            return { drivers, trails, driverRoutes }
        })
        performance.measure('gt:batch-update', 'gt-batch-start')
    },

    markStall: (id, stalledSince) =>
        set((s) => {
            if (!s.drivers[id] || s.drivers[id].stalledSince) return s
            return { drivers: { ...s.drivers, [id]: { ...s.drivers[id], stalledSince } } }
        }),

    patchDelivery: (id, partial) =>
        set((s) => ({
            deliveries: {
                ...s.deliveries,
                [id]: s.deliveries[id]
                    ? { ...s.deliveries[id], ...partial }
                    : {
                        id,
                        status: 'Created' as const,
                        assignedDriverId: null,
                        districtId: '',
                        etaDeadline: null,
                        createdAt: new Date().toISOString(),
                        routeDistanceMeters: null,
                        routeDurationSeconds: null,
                        routeCost: null,
                        ...partial,
                    },
            },
        })),

    pushAnomaly: (alert) =>
        set((s) => {
            if (s.anomalyQueue.some((item) => item.id === alert.id)) {
                return s
            }

            return {
                anomalyQueue: [alert, ...s.anomalyQueue].slice(0, APP_CONFIG.store.anomalyQueueLimit),
            }
        }),

    pushSurge: (alert) =>
        set((s) => ({
            surgeAlerts: [alert, ...s.surgeAlerts].slice(0, 20),
        })),

    pushIncident: (incident) =>
        set((s) => ({
            incidents: [incident, ...s.incidents].slice(0, 20),
        })),

    initDrivers: (drivers) =>
        set((s) => {
            const updates: Record<string, DriverState> = {}
            for (const d of drivers) {
                const existing = s.drivers[d.id]
                // If we already have live position from SignalR, keep it; just enrich name/status
                updates[d.id] = existing
                    ? { ...existing, name: d.name, status: d.status }
                    : d
            }
            return { drivers: { ...s.drivers, ...updates } }
        }),
}))

if (typeof window !== 'undefined') (window as any).__gs = useLiveStore