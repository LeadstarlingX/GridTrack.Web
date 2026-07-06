import { useMemo } from 'react'
import { Source, Layer, Marker } from 'react-map-gl/maplibre'
import { useMapStore } from '@/store/mapStore'
import { useLiveStore } from '@/store/liveStore'
import { useDelivery } from '@/lib/api/queries/useDelivery'

const EMPTY_FC: GeoJSON.FeatureCollection = { type: 'FeatureCollection', features: [] }
const EMPTY_ROUTE: [number, number][] = []

function GpsPin({ color }: { color: string }) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 36"
            width={28}
            height={42}
            style={{ display: 'block', filter: 'drop-shadow(0 2px 5px rgba(0,0,0,0.4))' }}
        >
            <path
                d="M12 0C5.373 0 0 5.373 0 12c0 9.5 12 24 12 24S24 21.5 24 12C24 5.373 18.627 0 12 0z"
                fill={color}
                stroke="white"
                strokeWidth="1.5"
            />
            <circle cx="12" cy="11.5" r="4.5" fill="white" opacity="0.9" />
        </svg>
    )
}

// Full route for the driver the operator clicked, with GPS-pin markers at pickup (green)
// and drop-off (red). Prefers the live routeAhead from SignalR (always current) over the
// stored OSRM polyline (stale once driver enters the drop-off leg).
export default function SelectedDeliveryRouteLayer() {
    const selectedDriverId = useMapStore((s) => s.selectedDriverId)
    const sidePanelMode = useMapStore((s) => s.sidePanelMode)

    const activeDelivery = useLiveStore((s) =>
        selectedDriverId
            ? Object.values(s.deliveries).find(
                (d) => d.assignedDriverId === selectedDriverId && d.status === 'InTransit',
            ) ?? null
            : null,
    )

    // Stable reference — returns null when no route data so Zustand equality passes.
    const liveRouteAhead = useLiveStore((s) =>
        selectedDriverId ? (s.driverRoutes[selectedDriverId] ?? EMPTY_ROUTE) : EMPTY_ROUTE,
    )

    // Focus mode draws its own route; only render here for a plain driver-click.
    const enabled = sidePanelMode === 'driver' && activeDelivery !== null
    const { data: detail } = useDelivery(enabled ? activeDelivery!.id : null)

    const { routeFC, pickupMarker, dropMarker } = useMemo(() => {
        const storedPts = detail?.routePolyline ?? []
        const usingLive = liveRouteAhead.length >= 2

        // Route line coords in [lng, lat] for MapLibre GeoJSON
        const coords: [number, number][] = usingLive
            ? liveRouteAhead.map(([lat, lng]) => [lng, lat])
            : storedPts.length >= 2
                ? storedPts.map((p) => [p.lng, p.lat])
                : []

        if (coords.length < 2) return { routeFC: EMPTY_FC, pickupMarker: null, dropMarker: null }

        const routeFC: GeoJSON.FeatureCollection = {
            type: 'FeatureCollection',
            features: [{ type: 'Feature', geometry: { type: 'LineString', coordinates: coords }, properties: {} }],
        }

        let pickupMarker: { lat: number; lng: number } | null = null
        let dropMarker: { lat: number; lng: number } | null = null

        if (usingLive) {
            // Live route: driver → destination. The first coord is the driver's moving position —
            // pickup pin must come from the FIXED stored route endpoint, not coords[0].
            if (storedPts.length >= 1) {
                const p = storedPts[storedPts.length - 1]
                pickupMarker = { lat: p.lat, lng: p.lng }
            }
            const last = coords[coords.length - 1]   // [lng, lat]
            dropMarker = { lat: last[1], lng: last[0] }
        } else {
            // Stored route only (driver home → pickup). Show the pickup destination pin.
            const last = coords[coords.length - 1]   // [lng, lat]
            pickupMarker = { lat: last[1], lng: last[0] }
        }

        return { routeFC, pickupMarker, dropMarker }
    }, [detail, liveRouteAhead])

    if (!enabled || routeFC.features.length === 0) return null

    return (
        <>
            <Source id="selected-route" type="geojson" data={routeFC}>
                <Layer
                    id="selected-route-casing"
                    type="line"
                    paint={{ 'line-color': '#1e3a8a', 'line-width': 6, 'line-opacity': 0.55 }}
                    layout={{ 'line-cap': 'round', 'line-join': 'round' }}
                />
                <Layer
                    id="selected-route-line"
                    type="line"
                    paint={{ 'line-color': '#38bdf8', 'line-width': 3, 'line-opacity': 0.95 }}
                    layout={{ 'line-cap': 'round', 'line-join': 'round' }}
                />
            </Source>

            {pickupMarker && (
                <Marker longitude={pickupMarker.lng} latitude={pickupMarker.lat} anchor="bottom">
                    <GpsPin color="#22c55e" />
                </Marker>
            )}

            {dropMarker && (
                <Marker longitude={dropMarker.lng} latitude={dropMarker.lat} anchor="bottom">
                    <GpsPin color="#ef4444" />
                </Marker>
            )}
        </>
    )
}
