import { create } from 'zustand'
import type { DriverState } from '@/types/driver'
import type { DeliveryState } from '@/types/delivery'
import type { AnomalyAlert } from '@/types/hub'
import { APP_CONFIG } from '@/config/app.config'
import { MOCK_DRIVERS, MOCK_DELIVERIES } from '@/constants/mockData'

const USE_MOCK = import.meta.env.VITE_USE_MOCK_SIGNALR !== 'false'

const TRAIL_MAX_POINTS = 40

interface LiveStore {
    drivers: Record<string, DriverState>
    deliveries: Record<string, DeliveryState>
    anomalyQueue: AnomalyAlert[]
    trails: Record<string, [number, number][]>

    updateDriverPosition: (id: string, lat: number, lng: number, districtId: string) => void
    patchDelivery: (id: string, partial: Partial<DeliveryState>) => void
    pushAnomaly: (alert: AnomalyAlert) => void
    markStall: (id: string, stalledSince: string) => void
}

export const useLiveStore = create<LiveStore>()((set) => ({
    drivers: USE_MOCK ? Object.fromEntries(MOCK_DRIVERS.map((d) => [d.id, d])) : {},
    deliveries: USE_MOCK ? Object.fromEntries(MOCK_DELIVERIES.map((d) => [d.id, d])) : {},
    anomalyQueue: [],
    trails: {},

    updateDriverPosition: (id, lat, lng, districtId) =>
        set((s) => {
            const prevTrail = s.trails[id] ?? []
            const trail: [number, number][] = [...prevTrail, [lat, lng] as [number, number]].slice(-TRAIL_MAX_POINTS)
            return {
                drivers: {
                    ...s.drivers,
                    [id]: { ...s.drivers[id], lat, lng, districtId, stalledSince: null },
                },
                trails: { ...s.trails, [id]: trail },
            }
        }),

    markStall: (id, stalledSince) =>
        set((s) => {
            if (!s.drivers[id] || s.drivers[id].stalledSince) return s
            return { drivers: { ...s.drivers, [id]: { ...s.drivers[id], stalledSince } } }
        }),

    patchDelivery: (id, partial) =>
        set((s) => ({
            deliveries: {
                ...s.deliveries,
                [id]: s.deliveries[id] ? { ...s.deliveries[id], ...partial } : s.deliveries[id],
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
}))