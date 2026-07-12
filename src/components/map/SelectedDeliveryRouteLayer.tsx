import { useMemo } from 'react'
import { Source, Layer, Marker } from 'react-map-gl/maplibre'
import { useMapStore } from '@/store/mapStore'
import { useFocusStore } from '@/store/focusStore'
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

// Route for the driver the operator clicked.
// Line: live routeAhead from SignalR (driver's current position → destination).
// Pins: pickup (green teardrop) from stored route's fixed last waypoint;
//       drop-off (red teardrop) from stable DB coordinates, shown independently
//       of whether the route line has data (survives driver reaching destination).
export default function SelectedDeliveryRouteLayer() {
    const selectedDriverId = useMapStore((s) => s.selectedDriverId)
    const sidePanelMode = useMapStore((s) => s.sidePanelMode)
    const focusedDriverId = useFocusStore((s) => s.focusedDriverId)

    // In focus mode toggleDriverPanel is a no-op, so selectedDriverId may be stale/null.
    // Use focusedDriverId as the authoritative source when following a driver.
    const driverId = sidePanelMode === 'focus' ? focusedDriverId : selectedDriverId

    const activeDelivery = useLiveStore((s) =>
        driverId
            ? Object.values(s.deliveries).find(
                (d) => d.assignedDriverId === driverId && d.status === 'InTransit',
            ) ?? null
            : null,
    )

    // Stable empty reference so Zustand equality check passes on no-data ticks.
    const liveRouteAhead = useLiveStore((s) =>
        driverId ? (s.driverRoutes[driverId] ?? EMPTY_ROUTE) : EMPTY_ROUTE,
    )

    const enabled = (sidePanelMode === 'driver' || sidePanelMode === 'focus') && activeDelivery !== null
    const { data: detail } = useDelivery(enabled ? activeDelivery!.id : null)

    const { routeFC, pickupMarker, dropMarker } = useMemo(() => {
        const storedPts = detail?.routePolyline ?? []
        const usingLive = liveRouteAhead.length >= 2

        // Route line: live only — never fall back to the stored driver-home→pickup polyline
        // (that route is wrong once the driver enters the drop-off leg).
        const routeCoords: [number, number][] = usingLive
            ? liveRouteAhead.map(([lat, lng]) => [lng, lat])
            : []

        const routeFC: GeoJSON.FeatureCollection = routeCoords.length >= 2
            ? {
                type: 'FeatureCollection',
                features: [{ type: 'Feature', geometry: { type: 'LineString', coordinates: routeCoords }, properties: {} }],
            }
            : EMPTY_FC

        // Drop pin: stable DB delivery destination, shown regardless of route state.
        const dropMarker: { lat: number; lng: number } | null =
            detail?.currentLat != null && detail?.currentLng != null
                ? { lat: detail.currentLat, lng: detail.currentLng }
                : null

        // Pickup pin: last point of stored OSRM polyline = fixed pickup address.
        const pickupMarker: { lat: number; lng: number } | null =
            storedPts.length >= 1
                ? { lat: storedPts[storedPts.length - 1].lat, lng: storedPts[storedPts.length - 1].lng }
                : null

        return { routeFC, pickupMarker, dropMarker }
    }, [detail, liveRouteAhead])

    if (!enabled) return null
    if (routeFC.features.length === 0 && !pickupMarker && !dropMarker) return null

    return (
        <>
            {routeFC.features.length > 0 && (
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
            )}

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
