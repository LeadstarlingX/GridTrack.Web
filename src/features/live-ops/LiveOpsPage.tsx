import { useEffect, useRef } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import type { MapRef } from 'react-map-gl/maplibre'
import LiveMap from '@/components/map/LiveMap'
import ConnectionStatus from '@/components/map/ConnectionStatus'
import LiveOpsBar from '@/components/live-ops/LiveOpsBar'
import SidePanel from '@/components/side-panel/SidePanel'
import { useMapStore } from '@/store/mapStore'
import { useFocusStore } from '@/store/focusStore'
import { useLiveStore } from '@/store/liveStore'
import { useFocusMode } from './useFocusMode'
import { APP_CONFIG } from '@/config/app.config'
import { useStallDetector } from '@/hooks/useStallDetector'

function normalizeGeoJson(data: GeoJSON.FeatureCollection) {
    const first =
        data.features?.[0]?.geometry?.type === 'Polygon'
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
            const swapped = feature.geometry.coordinates.map((ring) => ring.map(([lat, lng]) => [lng, lat]))
            return { ...feature, geometry: { ...feature.geometry, coordinates: swapped } }
        }),
    }
}

function normalizeBoundaryGeoJson(data: GeoJSON.FeatureCollection) {
    const normalized = normalizeGeoJson(data)
    return {
        ...normalized,
        features: normalized.features.map((feature) => {
            const osmId = feature.properties?.osm_id ?? feature.properties?.osmId ?? feature.id
            const boundaryId = osmId != null ? String(osmId) : ''
            const displayName = (feature.properties?.name_fixed ?? feature.properties?.name ?? boundaryId) as string
            return {
                ...feature,
                properties: {
                    ...feature.properties,
                    boundaryId,
                    displayName,
                },
            }
        }),
    }
}

function applyBoundaryToStore(raw: GeoJSON.FeatureCollection) {
    const normalized = normalizeBoundaryGeoJson(raw)
    useMapStore.getState().setDistrictBoundariesGeoJSON(normalized)
}

export default function LiveOpsPage() {
    const mapRef = useRef<MapRef | null>(null)
    const setHeatmapGeoJSON = useMapStore((s) => s.setHeatmapGeoJSON)
    const heatmapResolution = APP_CONFIG.map.heatmapResolution
    const location = useLocation()
    const navigate = useNavigate()
    const enterFocusMode = useFocusStore((s) => s.enterFocusMode)
    const setSidePanelMode = useMapStore((s) => s.setSidePanelMode)

    useFocusMode(mapRef)
    useStallDetector()

    useEffect(() => {
        const fileName = `/h3-damascus-r${heatmapResolution}.geojson`
        fetch(fileName)
            .then((r) => {
                if (!r.ok) throw new Error(`Missing H3 file: ${fileName}`)
                return r.json()
            })
            .then((data) => setHeatmapGeoJSON(normalizeGeoJson(data)))
            .catch((err) => console.warn(err))
    }, [setHeatmapGeoJSON, heatmapResolution])

    // Always use local GeoJSON — has Arabic names (name_fixed) and full boundary data
    useEffect(() => {
        fetch(APP_CONFIG.map.districtBoundariesFile)
            .then((r) => {
                if (!r.ok) throw new Error(`Missing district boundaries file`)
                return r.json()
            })
            .then(applyBoundaryToStore)
            .catch((err) => console.warn(err))
    }, [])

    // Deep-link focus mode from DeliveriesPage
    useEffect(() => {
        const state = location.state as { focusDeliveryId?: string } | null
        const focusDeliveryId = state?.focusDeliveryId
        if (!focusDeliveryId) return

        const delivery = useLiveStore.getState().deliveries[focusDeliveryId]
        if (!delivery || !delivery.assignedDriverId) return

        enterFocusMode(
            delivery.id,
            delivery.assignedDriverId,
            [],
            delivery.etaSeconds ?? APP_CONFIG.map.defaultEtaFallbackSeconds,
        )
        setSidePanelMode('focus')
        navigate('/', { replace: true, state: null })
    }, [enterFocusMode, location.state, navigate, setSidePanelMode])

    return (
        <div className="flex flex-col h-full">
            <LiveOpsBar />
            <div className="relative flex-1">
                <LiveMap
                    onMapReady={(m) => { mapRef.current = m }}
                />
                <ConnectionStatus />
                <SidePanel />
            </div>
        </div>
    )
}
