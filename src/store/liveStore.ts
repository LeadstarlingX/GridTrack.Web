import { create } from 'zustand'
import type { DriverState } from '@/types/driver'
import type { DeliveryState } from '@/types/delivery'
import type { AnomalyAlert } from '@/types/hub'
import { toast } from '@/components/ui'
import { getMapRef } from '@/lib/mapRef'
import { useMapStore } from '@/store/mapStore'
import { useSettingsStore } from '@/store/settingsStore'
import { MOCK_DRIVERS, MOCK_DELIVERIES } from '@/constants/mockData'

interface LiveStore {
    drivers: Record<string, DriverState>
    deliveries: Record<string, DeliveryState>
    anomalyQueue: AnomalyAlert[]

    updateDriverPosition: (id: string, lat: number, lng: number, districtId: string) => void
    patchDelivery: (id: string, partial: Partial<DeliveryState>) => void
    pushAnomaly: (alert: AnomalyAlert) => void
}

export const useLiveStore = create<LiveStore>()((set) => ({
    drivers: Object.fromEntries(MOCK_DRIVERS.map((d) => [d.id, d])),
    deliveries: Object.fromEntries(MOCK_DELIVERIES.map((d) => [d.id, d])),
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

            if (useSettingsStore.getState().toastsEnabled) {
                toast.error(`x ${alert.reason}`, {
                    duration: 8000,
                    action: {
                        label: 'View',
                        onClick: () => {
                            const map = getMapRef()
                            map?.flyTo([alert.lat, alert.lng], 15)
                            const mapState = useMapStore.getState()
                            mapState.selectDriver(alert.driverId)
                            mapState.setSidePanelMode('driver')
                        },
                    },
                })
            }

            return {
                anomalyQueue: [alert, ...s.anomalyQueue].slice(0, 50),
            }
        }),
}))