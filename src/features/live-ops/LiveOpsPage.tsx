import { useEffect, useRef } from 'react'
import L from 'leaflet'
import LiveMap from '@/components/map/LiveMap'
import MapControls from '@/components/map/MapControls'
import ConnectionStatus from '@/components/map/ConnectionStatus'
import SidePanel from '@/components/side-panel/SidePanel'
import { useMapStore } from '@/store/mapStore'
import { startMockEmitter } from '@/lib/signalr/mockEmitter'

export default function LiveOpsPage() {
    const mapRef = useRef<L.Map | null>(null)
    const setHexGeoJSON = useMapStore((s) => s.setHexGeoJSON)

    useEffect(() => {
        fetch('/h3-damascus.geojson')
            .then((r) => r.json())
            .then(setHexGeoJSON)
    }, [setHexGeoJSON])

    useEffect(() => {
        if (import.meta.env.VITE_USE_MOCK_SIGNALR !== 'true') return
        const cleanup = startMockEmitter()
        return cleanup
    }, [])

    return (
        <div className="relative h-full">
            <LiveMap onMapReady={(m) => { mapRef.current = m }} />
            <ConnectionStatus />
            <MapControls />
            <SidePanel />
        </div>
    )
}