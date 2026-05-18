import { useEffect, useRef } from 'react'
import L from 'leaflet'
import LiveMap from '@/components/map/LiveMap'
import ConnectionStatus from '@/components/map/ConnectionStatus'
import MapControls from '@/components/map/MapControls'
import SidePanel from '@/components/side-panel/SidePanel'
import { useMapStore } from '@/store/mapStore'
import { startMockEmitter } from '@/lib/signalr/mockEmitter'
import { setMapRef } from '@/lib/mapRef'
import { useFocusMode } from './useFocusMode'

function normalizeGeoJson(data: GeoJSON.FeatureCollection) {
    const first = data.features?.[0]?.geometry?.type === 'Polygon'
        ? (data.features[0].geometry.coordinates[0]?.[0] as number[] | undefined)
        : undefined

    if (!first || first.length < 2) return data

    const [a, b] = first
    const looksReversed = a < 35 && b > 35
    if (!looksReversed) return data

    return {
        ...data,
        features: data.features.map((feature) => {
            if (feature.geometry.type !== 'Polygon') return feature
            const swapped = feature.geometry.coordinates.map((ring) =>
                ring.map(([lat, lng]) => [lng, lat])
            )
            return {
                ...feature,
                geometry: {
                    ...feature.geometry,
                    coordinates: swapped,
                },
            }
        }),
    }
}

export default function LiveOpsPage() {
    const mapRef = useRef<L.Map | null>(null)
    const setHexGeoJSON = useMapStore((s) => s.setHexGeoJSON)
    const setHeatmapGeoJSON = useMapStore((s) => s.setHeatmapGeoJSON)
    const hexResolution = useMapStore((s) => s.hexResolution)
    const heatmapResolution = 8

    useFocusMode(mapRef)

    useEffect(() => {
        const fileName = `/h3-damascus-r${hexResolution}.geojson`
        const url = `${fileName}?v=${hexResolution}`
        setHexGeoJSON(null)
        fetch(url)
            .then((r) => {
                if (!r.ok) {
                    throw new Error(`Missing H3 file: ${fileName}`)
                }
                return r.json()
            })
            .then((data) => setHexGeoJSON(normalizeGeoJson(data)))
            .catch((err) => {
                console.warn(err)
            })
    }, [setHexGeoJSON, hexResolution])

    useEffect(() => {
        const fileName = `/h3-damascus-r${heatmapResolution}.geojson`
        fetch(fileName)
            .then((r) => {
                if (!r.ok) {
                    throw new Error(`Missing H3 file: ${fileName}`)
                }
                return r.json()
            })
            .then((data) => setHeatmapGeoJSON(normalizeGeoJson(data)))
            .catch((err) => {
                console.warn(err)
            })
    }, [setHeatmapGeoJSON])

    useEffect(() => {
        if (import.meta.env.VITE_USE_MOCK_SIGNALR !== 'true') return
        const cleanup = startMockEmitter()
        return cleanup
    }, [])

    return (
        <div className="relative h-full">
            <LiveMap onMapReady={(m) => {
                mapRef.current = m
                setMapRef(m)
            }} />
            <ConnectionStatus />
            <MapControls />
            <SidePanel />
        </div>
    )
}