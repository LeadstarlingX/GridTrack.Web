import { useEffect, useRef } from 'react'
import { MapContainer, TileLayer, useMap } from 'react-leaflet'
import L from 'leaflet'
import DriverMarkers from './DriverMarker'
import DriverTrailLayer from './DriverTrailLayer'
import DistrictBoundaryLayer from './DistrictBoundaryLayer'
import DistrictDeliveryBadges from './DistrictDeliveryBadges'
import HeatmapLayer from './HeatmapLayer'
import HistoricalHeatmapLayer from './HistoricalHeatmapLayer'
import RecommendationOverlay from './RecommendationOverlay'
import RoutePolyline from './RoutePolyline'
import DeliveryRoutesLayer from './DeliveryRoutesLayer'
import { APP_CONFIG } from '@/config/app.config'
import { useFocusStore } from '@/store/focusStore'
import { useLiveStore } from '@/store/liveStore'

function MapRefCapture({ setMap }: { setMap: (map: L.Map) => void }) {
    const map = useMap()
    useEffect(() => { setMap(map) }, [map, setMap])
    return null
}

function AutoFollowController() {
    const map = useMap()
    const autoFollow = useFocusStore((s) => s.autoFollow)
    const focusedDriverId = useFocusStore((s) => s.focusedDriverId)
    const fLat = useLiveStore((s) => focusedDriverId ? (s.drivers[focusedDriverId]?.lat ?? 0) : 0)
    const fLng = useLiveStore((s) => focusedDriverId ? (s.drivers[focusedDriverId]?.lng ?? 0) : 0)

    useEffect(() => {
        if (!autoFollow) return
        const onMoveStart = (e: any) => {
            if (e.originalEvent) useFocusStore.getState().toggleAutoFollow()
        }
        map.on('movestart', onMoveStart)
        return () => { map.off('movestart', onMoveStart) }
    }, [map, autoFollow])

    useEffect(() => {
        if (!autoFollow || !focusedDriverId) return
        map.panTo([fLat, fLng])
    }, [map, autoFollow, focusedDriverId, fLat, fLng])

    return null
}

interface Props {
    onMapReady: (map: L.Map) => void
}

export default function LiveMap({ onMapReady }: Props) {
    const stableRef = useRef(onMapReady)
    stableRef.current = onMapReady

    return (
        <MapContainer
            center={APP_CONFIG.map.center}
            zoom={APP_CONFIG.map.defaultZoom}
            preferCanvas={true}
            className="h-full w-full z-0"
            zoomControl={false}
            attributionControl={false}
        >
            <TileLayer
                attribution={APP_CONFIG.map.tileAttribution}
                url={APP_CONFIG.map.tileUrl}
            />
            <MapRefCapture setMap={(m) => stableRef.current(m)} />
            <AutoFollowController />
            <DeliveryRoutesLayer />
            <DriverTrailLayer />
            <DriverMarkers />
            <DistrictDeliveryBadges />
            <HeatmapLayer />
            <HistoricalHeatmapLayer />
            <RecommendationOverlay />
            <RoutePolyline />
            <DistrictBoundaryLayer />
        </MapContainer>
    )
}
