import { create } from 'zustand'
import type { DriverState } from '@/types/driver'
import type { DeliveryState } from '@/types/delivery'
import type { AnomalyAlert } from '@/types/hub'
import { APP_CONFIG } from '@/config/app.config'
import { MOCK_DRIVERS, MOCK_DELIVERIES } from '@/constants/mockData'

const USE_MOCK = import.meta.env.VITE_USE_MOCK_SIGNALR !== 'false'

interface LiveStore {
    drivers: Record<string, DriverState>
    deliveries: Record<string, DeliveryState>
    anomalyQueue: AnomalyAlert[]

    updateDriverPosition: (id: string, lat: number, lng: number, districtId: string) => void
    patchDelivery: (id: string, partial: Partial<DeliveryState>) => void
    pushAnomaly: (alert: AnomalyAlert) => void
}

export const useLiveStore = create<LiveStore>()((set) => ({
    drivers: USE_MOCK ? Object.fromEntries(MOCK_DRIVERS.map((d) => [d.id, d])) : {},
    deliveries: USE_MOCK ? Object.fromEntries(MOCK_DELIVERIES.map((d) => [d.id, d])) : {},
    anomalyQueue: [],

    updateDriverPosition: (id, lat, lng, districtId) =>
        set((s) => ({
            drivers: {
                ...s.drivers,
                [id]: { ...s.drivers[id], lat, lng, districtId },
            },
        })),

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