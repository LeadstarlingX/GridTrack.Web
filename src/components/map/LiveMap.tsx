import { useEffect, useRef, useState, useCallback } from 'react'
import Map, { Source, Layer } from 'react-map-gl/maplibre'
import type { MapRef, MapLayerMouseEvent } from 'react-map-gl/maplibre'
import type { GeoJSONSource } from 'maplibre-gl'
import { APP_CONFIG } from '@/config/app.config'
import { SATELLITE_MAP_STYLE } from '@/config/mapStyle'
import { useFocusStore } from '@/store/focusStore'
import { useLiveStore } from '@/store/liveStore'
import { useMapStore } from '@/store/mapStore'
import { setMapRef } from '@/lib/mapRef'
import { getHubConnection } from '@/lib/hubConnection'
import { apiClient } from '@/lib/api/client'
import type { DriverState } from '@/types/driver'
import type { DistrictGroupDto } from '@/types/api'
import DriverTrailLayer from './DriverTrailLayer'
import SelectedDeliveryRouteLayer from './SelectedDeliveryRouteLayer'
import RoutePolyline from './RoutePolyline'
import HistoricalHeatmapLayer from './HistoricalHeatmapLayer'
import DistrictStaffingLayer from './DistrictStaffingLayer'
import DistrictBoundaryLayer from './DistrictBoundaryLayer'
import DistrictDeliveryBadges from './DistrictDeliveryBadges'
import RecommendationOverlay from './RecommendationOverlay'

const EMPTY_FC: GeoJSON.FeatureCollection = { type: 'FeatureCollection', features: [] }

// Coordinate note: stores use [lat, lng]; MapLibre/GeoJSON uses [lng, lat]. Always swap.

function buildDriversGeoJSON(
    drivers: Record<string, DriverState>,
    stalledOnly: boolean,
): GeoJSON.FeatureCollection {
    const features: GeoJSON.Feature[] = []
    for (const d of Object.values(drivers)) {
        if (stalledOnly && d.stalledSince === null) continue
        features.push({
            type: 'Feature',
            geometry: { type: 'Point', coordinates: [d.lng, d.lat] },
            properties: { id: d.id, name: d.name, status: d.status, stalled: d.stalledSince !== null },
        })
    }
    return { type: 'FeatureCollection', features }
}

function buildTrailGeoJSON(
    trails: Record<string, [number, number][]>,
    activeId: string | null,
): GeoJSON.FeatureCollection {
    if (!activeId) return EMPTY_FC
    const trail = trails[activeId]
    if (!trail || trail.length < 2) return EMPTY_FC
    return {
        type: 'FeatureCollection',
        features: [{
            type: 'Feature',
            geometry: { type: 'LineString', coordinates: trail.map(([lat, lng]) => [lng, lat]) },
            properties: {},
        }],
    }
}

function featureLngLatBbox(f: GeoJSON.Feature): [number, number, number, number] | null {
    let minLng = Infinity, minLat = Infinity, maxLng = -Infinity, maxLat = -Infinity
    const visit = (c: unknown): void => {
        if (!Array.isArray(c)) return
        if (typeof c[0] === 'number') {
            const [lng, lat] = c as number[]
            if (lng < minLng) minLng = lng
            if (lng > maxLng) maxLng = lng
            if (lat < minLat) minLat = lat
            if (lat > maxLat) maxLat = lat
        } else {
            c.forEach(visit)
        }
    }
    if (f.geometry.type === 'Polygon') f.geometry.coordinates.forEach(visit)
    else if (f.geometry.type === 'MultiPolygon') f.geometry.coordinates.forEach((p) => p.forEach(visit))
    if (!isFinite(minLng)) return null
    return [minLng, minLat, maxLng, maxLat]
}

const CIRCLE_PAINT = {
    'circle-radius': ['case', ['get', 'stalled'], 10, 7],
    'circle-color': [
        'case',
        ['get', 'stalled'],                              '#f97316',
        ['==', ['get', 'status'], 'available'],          '#22c55e',
        ['==', ['get', 'status'], 'offline'],            '#94a3b8',
        '#3b82f6',
    ],
    'circle-stroke-width': 2,
    'circle-stroke-color': '#ffffff',
    'circle-opacity': 0.95,
} as const

const HEATMAP_PAINT = {
    'heatmap-weight': 1,
    'heatmap-intensity': ['interpolate', ['linear'], ['zoom'], 7, 1, 15, 3],
    'heatmap-color': [
        'interpolate', ['linear'], ['heatmap-density'],
        0,    'rgba(0,0,0,0)',
        0.25, '#22c55e',
        0.5,  '#eab308',
        0.75, '#f59e0b',
        1,    '#ef4444',
    ],
    'heatmap-radius': ['interpolate', ['linear'], ['zoom'], 7, 20, 15, 40],
    'heatmap-opacity': 0.65,
} as const

interface Props {
    onMapReady: (map: MapRef) => void
}

export default function LiveMap({ onMapReady }: Props) {
    const mapRef = useRef<MapRef>(null)
    const autoFollow    = useFocusStore((s) => s.autoFollow)
    const focusedDriverId = useFocusStore((s) => s.focusedDriverId)
    const fLat = useLiveStore((s) => focusedDriverId ? (s.drivers[focusedDriverId]?.lat ?? 0) : 0)
    const fLng = useLiveStore((s) => focusedDriverId ? (s.drivers[focusedDriverId]?.lng ?? 0) : 0)
    const toggleDriverPanel = useMapStore((s) => s.toggleDriverPanel)
    const stalledOnly   = useMapStore((s) => s.stalledOnly)
    const heatmapEnabled = useMapStore((s) => s.heatmapEnabled)
    const focusedId     = useFocusStore((s) => s.focusedDriverId)
    const selectedId    = useMapStore((s) => s.selectedDriverId)
    const [cursor, setCursor] = useState('')

    // Ref lets the liveStore subscription read current activeId without re-subscribing
    const activeIdRef = useRef<string | null>(null)
    useEffect(() => { activeIdRef.current = focusedId ?? selectedId }, [focusedId, selectedId])

    // Viewport-based SignalR group subscription: districtId → groupId[]
    const districtToGroupsRef = useRef<Record<string, string[]>>({})
    const joinedGroupsRef     = useRef(new Set<string>())
    useEffect(() => {
        apiClient.get<DistrictGroupDto[]>('/api/district-groups')
            .then((res) => {
                const map: Record<string, string[]> = {}
                for (const g of res.data) {
                    for (const d of g.districtIds) {
                        if (!map[d]) map[d] = []
                        map[d].push(g.id)
                    }
                }
                districtToGroupsRef.current = map
            })
            .catch(() => {})
    }, [])

    // Auto-follow focused driver
    useEffect(() => {
        if (!autoFollow || !focusedDriverId) return
        mapRef.current?.flyTo({ center: [fLng, fLat] })
    }, [autoFollow, focusedDriverId, fLat, fLng])

    // Hot-path: update all driver-derived sources imperatively (no React re-render)
    useEffect(() => {
        return useLiveStore.subscribe((state) => {
            const map = mapRef.current?.getMap()
            if (!map?.isStyleLoaded()) return
                ;(map.getSource('drivers') as GeoJSONSource | undefined)
                ?.setData(buildDriversGeoJSON(state.drivers, stalledOnly))
            ;(map.getSource('driver-trail') as GeoJSONSource | undefined)
                ?.setData(buildTrailGeoJSON(state.trails, activeIdRef.current))
        })
    }, [stalledOnly])

    // Update trail when the active driver changes (not just on position tick)
    useEffect(() => {
        const map = mapRef.current?.getMap()
        if (!map?.isStyleLoaded()) return
        const state = useLiveStore.getState()
        ;(map.getSource('driver-trail') as GeoJSONSource | undefined)
            ?.setData(buildTrailGeoJSON(state.trails, activeIdRef.current))
    }, [focusedId, selectedId])

    const onClick = useCallback((e: MapLayerMouseEvent) => {
        if (!e.target.isStyleLoaded()) return
        const features = e.target.queryRenderedFeatures(e.point, { layers: ['driver-circles'] })
        if (features.length > 0) {
            const driverId = features[0].properties?.id as string
            if (driverId) {
                toggleDriverPanel(driverId)
                e.target.flyTo({ center: e.lngLat.toArray() as [number, number], zoom: APP_CONFIG.map.focusZoom, duration: APP_CONFIG.map.flyToDurationMs })
            }
        }
    }, [toggleDriverPanel])

    const onMouseMove = useCallback((e: MapLayerMouseEvent) => {
        if (!e.target.isStyleLoaded()) return
        const features = e.target.queryRenderedFeatures(e.point, { layers: ['driver-circles'] })
        setCursor(features.length > 0 ? 'pointer' : '')
    }, [])

    const onMoveStart = useCallback((e: { originalEvent?: Event }) => {
        if (e.originalEvent && autoFollow) useFocusStore.getState().toggleAutoFollow()
    }, [autoFollow])

    return (
        <Map
            ref={mapRef}
            mapStyle={SATELLITE_MAP_STYLE}
            initialViewState={{
                longitude: APP_CONFIG.map.center[1],
                latitude:  APP_CONFIG.map.center[0],
                zoom:      APP_CONFIG.map.defaultZoom,
            }}
            style={{ width: '100%', height: '100%' }}
            cursor={cursor}
            onClick={onClick}
            onMouseMove={onMouseMove}
            onMoveStart={onMoveStart}
            onLoad={() => {
                const m = mapRef.current
                if (!m) return
                setMapRef(m.getMap())
                onMapReady(m)
                // Seed sources with current store state
                const state = useLiveStore.getState()
                const rawMap = m.getMap()
                ;(rawMap.getSource('drivers') as GeoJSONSource | undefined)
                    ?.setData(buildDriversGeoJSON(state.drivers, stalledOnly))

                // Viewport-based district group subscription
                const syncGroups = () => {
                    const conn = getHubConnection()
                    if (!conn) return
                    const bounds = rawMap.getBounds()
                    const boundaries = useMapStore.getState().districtBoundariesGeoJSON
                    if (!boundaries) return
                    const [vW, vS, vE, vN] = [bounds.getWest(), bounds.getSouth(), bounds.getEast(), bounds.getNorth()]
                    const next = new Set<string>()
                    for (const f of boundaries.features) {
                        const bbox = featureLngLatBbox(f as GeoJSON.Feature)
                        if (!bbox) continue
                        const [fW, fS, fE, fN] = bbox
                        if (fE < vW || fW > vE || fN < vS || fS > vN) continue
                        const distId = f.properties?.boundaryId ?? String(f.properties?.osm_id ?? '')
                        for (const gId of (districtToGroupsRef.current[distId] ?? [])) next.add(gId)
                    }
                    const cur = joinedGroupsRef.current
                    for (const g of cur) if (!next.has(g)) { conn.invoke('LeaveDistrictGroup', g).catch(() => {}); cur.delete(g) }
                    for (const g of next) if (!cur.has(g)) { conn.invoke('JoinDistrictGroup', g).catch(() => {}); cur.add(g) }
                }
                rawMap.on('moveend', syncGroups)
                syncGroups()
            }}
            attributionControl={false}
        >
            {/* Single source for all driver positions; reused by both circles and heatmap */}
            <Source id="drivers" type="geojson" data={EMPTY_FC}>
                {heatmapEnabled && (
                    <Layer id="driver-heatmap" type="heatmap" paint={HEATMAP_PAINT as never} />
                )}
                <Layer id="driver-circles" type="circle" paint={CIRCLE_PAINT as never} />
            </Source>

            <DriverTrailLayer />
            <SelectedDeliveryRouteLayer />
            <RoutePolyline />

            <HistoricalHeatmapLayer />
            <DistrictStaffingLayer />
            <DistrictBoundaryLayer />
            <DistrictDeliveryBadges />
            <RecommendationOverlay />
        </Map>
    )
}
