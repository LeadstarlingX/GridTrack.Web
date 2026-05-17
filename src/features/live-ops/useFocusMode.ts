import { useEffect, useRef } from 'react'
import L from 'leaflet'
import { useFocusStore } from '@/store/focusStore'
import { useMapStore } from '@/store/mapStore'
import { useLiveStore } from '@/store/liveStore'

export function useFocusMode(mapRef: React.MutableRefObject<L.Map | null>) {
    const focusedDeliveryId = useFocusStore((s) => s.focusedDeliveryId)
    const focusedDriverId = useFocusStore((s) => s.focusedDriverId)
    const prevFocusedId = useRef<string | null>(null)

    useEffect(() => {
        if (focusedDeliveryId && !prevFocusedId.current) {
            const driver = useLiveStore.getState().drivers[focusedDriverId ?? '']
            if (driver && mapRef.current) {
                mapRef.current.flyTo([driver.lat, driver.lng], 15, { duration: 1.2 })
            }
        }
        prevFocusedId.current = focusedDeliveryId
    }, [focusedDeliveryId, focusedDriverId, mapRef])

    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && useFocusStore.getState().focusedDeliveryId) {
                useFocusStore.getState().exitFocusMode()
                useMapStore.getState().setSidePanelMode('idle')
            }
        }
        window.addEventListener('keydown', onKey)
        return () => window.removeEventListener('keydown', onKey)
    }, [])
}