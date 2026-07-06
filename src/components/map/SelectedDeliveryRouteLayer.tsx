import { useMemo } from 'react'
import { Source, Layer } from 'react-map-gl/maplibre'
import { useMapStore } from '@/store/mapStore'
import { useLiveStore } from '@/store/liveStore'
import { useDelivery } from '@/lib/api/queries/useDelivery'

const EMPTY_FC: GeoJSON.FeatureCollection = { type: 'FeatureCollection', features: [] }

// Full origin→destination route for the driver the operator clicked, with explicit
// pickup (green) and drop-off (amber) pins. Sourced from the delivery's stored OSRM
// polyline (pickup = first waypoint, drop = last) — not the live "route ahead".
export default function SelectedDeliveryRouteLayer() {
    const selectedDriverId = useMapStore((s) => s.selectedDriverId)
    const sidePanelMode = useMapStore((s) => s.sidePanelMode)

    // The active in-transit delivery for the selected driver (if any).
    const activeDelivery = useLiveStore((s) =>
        selectedDriverId
            ? Object.values(s.deliveries).find(
            (d) => d.assignedDriverId === selectedDriverId && d.status === 'InTransit',
        ) ?? null
            : null,
    )

    // Focus mode draws its own route (RoutePolyline); only render here for a plain click.
    const enabled = sidePanelMode === 'driver' && activeDelivery !== null
    const { data: detail } = useDelivery(enabled ? activeDelivery!.id : null)

    const { route, pickup, drop } = useMemo(() => {
        const pts = detail?.routePolyline ?? []
        if (pts.length < 2) return { route: EMPTY_FC, pickup: EMPTY_FC, drop: EMPTY_FC }
        const coords = pts.map((p) => [p.lng, p.lat])
        const first = coords[0]
        const last = coords[coords.length - 1]
        return {
            route: {
                type: 'FeatureCollection',
                features: [{ type: 'Feature', geometry: { type: 'LineString', coordinates: coords }, properties: {} }],
            } as GeoJSON.FeatureCollection,
            pickup: {
                type: 'FeatureCollection',
                features: [{ type: 'Feature', geometry: { type: 'Point', coordinates: first }, properties: {} }],
            } as GeoJSON.FeatureCollection,
            drop: {
                type: 'FeatureCollection',
                features: [{ type: 'Feature', geometry: { type: 'Point', coordinates: last }, properties: {} }],
            } as GeoJSON.FeatureCollection,
        }
    }, [detail])

    if (!enabled || route.features.length === 0) return null

    return (
        <>
            <Source id="selected-route" type="geojson" data={route}>
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

            {/* Pickup (green) */}
            <Source id="selected-pickup" type="geojson" data={pickup}>
                <Layer id="selected-pickup-ring" type="circle"
                       paint={{ 'circle-radius': 9, 'circle-color': 'transparent', 'circle-stroke-width': 2.5, 'circle-stroke-color': '#22c55e' }} />
                <Layer id="selected-pickup-dot" type="circle"
                       paint={{ 'circle-radius': 5, 'circle-color': '#22c55e', 'circle-stroke-width': 1.5, 'circle-stroke-color': '#ffffff' }} />
            </Source>

            {/* Drop-off (amber) */}
            <Source id="selected-drop" type="geojson" data={drop}>
                <Layer id="selected-drop-ring" type="circle"
                       paint={{ 'circle-radius': 9, 'circle-color': 'transparent', 'circle-stroke-width': 2.5, 'circle-stroke-color': '#f59e0b' }} />
                <Layer id="selected-drop-dot" type="circle"
                       paint={{ 'circle-radius': 5, 'circle-color': '#f59e0b', 'circle-stroke-width': 1.5, 'circle-stroke-color': '#ffffff' }} />
            </Source>
        </>
    )
}
