import { create } from 'zustand'

interface FocusStore {
    focusedDeliveryId: string | null
    focusedDriverId: string | null
    autoFollow: boolean
    routePolyline: [number, number][] | null
    etaSeconds: number | null

    enterFocusMode: (
        deliveryId: string,
        driverId: string,
        polyline: [number, number][],
        etaSeconds: number
    ) => void
    exitFocusMode: () => void
    toggleAutoFollow: () => void
    setEta: (seconds: number) => void
}

export const useFocusStore = create<FocusStore>()((set) => ({
    focusedDeliveryId: null,
    focusedDriverId: null,
    autoFollow: true,
    routePolyline: null,
    etaSeconds: null,

    enterFocusMode: (deliveryId, driverId, polyline, etaSeconds) =>
        set({ focusedDeliveryId: deliveryId, focusedDriverId: driverId, routePolyline: polyline, etaSeconds, autoFollow: true }),

    exitFocusMode: () =>
        set({ focusedDeliveryId: null, focusedDriverId: null, routePolyline: null, etaSeconds: null, autoFollow: true }),

    toggleAutoFollow: () => set((s) => ({ autoFollow: !s.autoFollow })),

    setEta: (seconds) => set({ etaSeconds: seconds }),
}))