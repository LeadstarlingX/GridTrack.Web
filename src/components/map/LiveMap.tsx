import { useEffect, useRef } from 'react'
import { MapContainer, TileLayer, useMap } from 'react-leaflet'
import L from 'leaflet'
import DriverMarkers from './DriverMarker'
import HexGridLayer from './HexGridLayer'
import HeatmapLayer from './HeatmapLayer'

function MapRefCapture({ setMap }: { setMap: (map: L.Map) => void }) {
    const map = useMap()
    useEffect(() => { setMap(map) }, [map, setMap])
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
            center={[33.5138, 36.2765]}
            zoom={12}
            preferCanvas={true}
            className="h-full w-full z-0"
            zoomControl={false}
        >
            <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <MapRefCapture setMap={(m) => stableRef.current(m)} />
            <DriverMarkers />
            <HexGridLayer />
            <HeatmapLayer />
        </MapContainer>
    )
}