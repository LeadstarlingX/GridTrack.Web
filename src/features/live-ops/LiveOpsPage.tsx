import { useEffect, useRef } from 'react'
import L from 'leaflet'
import LiveMap from '@/components/map/LiveMap'
import ConnectionStatus from '@/components/map/ConnectionStatus'
import SidePanel from '@/components/side-panel/SidePanel'
import { useMapStore } from '@/store/mapStore'
import { startMockEmitter } from '@/lib/signalr/mockEmitter'
import { setMapRef } from '@/lib/mapRef'
import DevDisabled from '@/components/shared/DevDisabled'
import { isPageEnabled } from '@/config/devPages'
import { useFocusMode } from './useFocusMode'

export default function LiveOpsPage() {
    const mapRef = useRef<L.Map | null>(null)
    const setHexGeoJSON = useMapStore((s) => s.setHexGeoJSON)

    useFocusMode(mapRef)

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

    if (!isPageEnabled('liveOps')) {
        return <DevDisabled title="Live Ops" />
    }

    return (
        <div className="relative h-full">
            <LiveMap onMapReady={(m) => {
                mapRef.current = m
                setMapRef(m)
            }} />
            <ConnectionStatus />
            <SidePanel />
        </div>
    )
}