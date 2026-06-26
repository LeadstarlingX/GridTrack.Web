import { create } from 'zustand'

interface FocusStore {
    focusedDeliveryId: string | null
    focusedDriverId: string | null
    autoFollow: boolean
    routePolyline: [number, number][] | null
    etaSeconds: number | null
    pickupCoord: [number, number] | null   // [lat, lng] — first waypoint
    dropoffCoord: [number, number] | null  // [lat, lng] — last waypoint

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
    pickupCoord: null,
    dropoffCoord: null,

    enterFocusMode: (deliveryId, driverId, polyline, etaSeconds) => {
        const pickup = polyline.length > 0 ? (polyline[0] as [number, number]) : null
        const dropoff = polyline.length > 1 ? (polyline[polyline.length - 1] as [number, number]) : null
        set({
            focusedDeliveryId: deliveryId,
            focusedDriverId: driverId,
            routePolyline: polyline,
            etaSeconds,
            autoFollow: true,
            pickupCoord: pickup,
            dropoffCoord: dropoff,
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
            dropoffCoord: null,
        }),

    toggleAutoFollow: () => set((s) => ({ autoFollow: !s.autoFollow })),

    setEta: (seconds) => set({ etaSeconds: seconds }),
}))