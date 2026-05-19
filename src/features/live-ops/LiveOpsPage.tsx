import { useEffect, useRef } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import L from 'leaflet'
import LiveMap from '@/components/map/LiveMap'
import ConnectionStatus from '@/components/map/ConnectionStatus'
import MapControls from '@/components/map/MapControls'
import SidePanel from '@/components/side-panel/SidePanel'
import { useMapStore } from '@/store/mapStore'
import { useFocusStore } from '@/store/focusStore'
import { useLiveStore } from '@/store/liveStore'
import { startMockEmitter } from '@/lib/signalr/mockEmitter'
import { setMapRef } from '@/lib/mapRef'
import { DAMASCUS_ROUTES } from '@/constants/mockRoutes'
import { getMockNeighborhoodStats } from '@/constants/mockData'
import { useFocusMode } from './useFocusMode'
import { APP_CONFIG } from '@/config/app.config'

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

function normalizeBoundaryGeoJson(data: GeoJSON.FeatureCollection) {
    const normalized = normalizeGeoJson(data)

    return {
        ...normalized,
        features: normalized.features.map((feature) => {
            const osmId = feature.properties?.osm_id ?? feature.properties?.osmId ?? feature.id
            const boundaryId = osmId != null ? String(osmId) : ''
            const displayName = (feature.properties?.name_fixed ?? feature.properties?.name ?? boundaryId) as string
            const expected = getMockNeighborhoodStats(boundaryId, displayName)

            return {
                ...feature,
                properties: {
                    ...feature.properties,
                    boundaryId,
                    displayName,
                    expectedDemand: expected.expectedDemand,
                    activeDrivers: expected.activeDrivers,
                    staffingRatio: expected.staffingRatio,
                },
            }
        }),
    }
}

export default function LiveOpsPage() {
    const mapRef = useRef<L.Map | null>(null)
    const setHexGeoJSON = useMapStore((s) => s.setHexGeoJSON)
    const setHeatmapGeoJSON = useMapStore((s) => s.setHeatmapGeoJSON)
    const setDistrictBoundariesGeoJSON = useMapStore((s) => s.setDistrictBoundariesGeoJSON)
    const hexResolution = useMapStore((s) => s.hexResolution)
    const heatmapResolution = 8
    const location = useLocation()
    const navigate = useNavigate()
    const enterFocusMode = useFocusStore((s) => s.enterFocusMode)
    const setSidePanelMode = useMapStore((s) => s.setSidePanelMode)

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
        const fileName = APP_CONFIG.map.districtBoundariesFile
        fetch(fileName)
            .then((r) => {
                if (!r.ok) {
                    throw new Error(`Missing district boundaries file: ${fileName}`)
                }
                return r.json()
            })
            .then((data) => {
                const normalized = normalizeBoundaryGeoJson(data)
                setDistrictBoundariesGeoJSON(normalized)

                const recommendationMap: Record<string, number> = {}
                normalized.features.forEach((feature) => {
                    const boundaryId = feature.properties?.boundaryId
                    const expectedDemand = feature.properties?.expectedDemand
                    if (!boundaryId || typeof expectedDemand !== 'number') return
                    recommendationMap[boundaryId] = expectedDemand
                })
                useMapStore.getState().setRecommendationMock(recommendationMap)
            })
            .catch((err) => {
                console.warn(err)
            })
    }, [setDistrictBoundariesGeoJSON])

    useEffect(() => {
        if (import.meta.env.VITE_USE_MOCK_SIGNALR !== 'true') return
        const cleanup = startMockEmitter()
        return cleanup
    }, [])

    useEffect(() => {
        const state = location.state as { focusDeliveryId?: string } | null
        const focusDeliveryId = state?.focusDeliveryId
        if (!focusDeliveryId) return

        const delivery = useLiveStore.getState().deliveries[focusDeliveryId]
        if (!delivery || !delivery.assignedDriverId) return

        const driver = useLiveStore.getState().drivers[delivery.assignedDriverId]
        const routeIndex = driver?.routeIndex ?? 0
        const polyline = DAMASCUS_ROUTES[routeIndex] ?? []
        enterFocusMode(delivery.id, delivery.assignedDriverId, polyline, delivery.etaSeconds ?? 420)
        setSidePanelMode('focus')
        navigate('/', { replace: true, state: null })
    }, [enterFocusMode, location.state, navigate, setSidePanelMode])

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