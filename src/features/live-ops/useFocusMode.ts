import { useEffect, useRef } from 'react'
import type { MapRef } from 'react-map-gl/maplibre'
import { useFocusStore } from '@/store/focusStore'
import { useMapStore } from '@/store/mapStore'
import { useLiveStore } from '@/store/liveStore'
import { APP_CONFIG } from '@/config/app.config'

export function useFocusMode(mapRef: React.MutableRefObject<MapRef | null>) {
    const focusedDeliveryId = useFocusStore((s) => s.focusedDeliveryId)
    const focusedDriverId   = useFocusStore((s) => s.focusedDriverId)
    const prevFocusedId     = useRef<string | null>(null)

    useEffect(() => {
        if (focusedDeliveryId && !prevFocusedId.current) {
            const driver = useLiveStore.getState().drivers[focusedDriverId ?? '']
            if (driver && mapRef.current) {
                // MapLibre flyTo: center is [lng, lat]
                mapRef.current.flyTo({
                    center: [driver.lng, driver.lat],
                    zoom: APP_CONFIG.map.focusZoom,
                    duration: APP_CONFIG.map.flyToDurationMs,
                })
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
