import { create } from 'zustand'

interface FocusStore {
    focusedDeliveryId: string | null
    focusedDriverId: string | null
    autoFollow: boolean
    routePolyline: [number, number][] | null
    pickupCoord: [number, number] | null
    dropCoord: [number, number] | null
    etaSeconds: number | null
    routeCost: number | null

    enterFocusMode: (
        deliveryId: string,
        driverId: string,
        polyline: [number, number][],
        etaSeconds: number | null,
        routeCost?: number | null,
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
    pickupCoord: null,
    dropCoord: null,
    routeCost: null,

    enterFocusMode: (deliveryId, driverId, polyline, etaSeconds, routeCost) => {
        const pickup = polyline.length > 0 ? (polyline[0] as [number, number]) : null
        const drop = polyline.length > 1 ? (polyline[polyline.length - 1] as [number, number]) : null
        set({
            focusedDeliveryId: deliveryId,
            focusedDriverId: driverId,
            routePolyline: polyline,
            pickupCoord: pickup,
            dropCoord: drop,
            etaSeconds,
            routeCost: routeCost ?? null,
            autoFollow: true,
        })
    },

    exitFocusMode: () =>
        set({
            focusedDeliveryId: null,
            focusedDriverId: null,
            routePolyline: null,
            etaSeconds: null,
            autoFollow: true,
            pickupCoord: null,
            dropCoord: null,
            routeCost: null,
        }),

    toggleAutoFollow: () => set((s) => ({ autoFollow: !s.autoFollow })),

    setEta: (seconds) => set({ etaSeconds: seconds }),
}))