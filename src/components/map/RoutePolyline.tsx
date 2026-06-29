import { useMemo } from 'react'
import { Source, Layer } from 'react-map-gl/maplibre'
import { useFocusStore } from '@/store/focusStore'
import { APP_CONFIG } from '@/config/app.config'

const EMPTY_FC: GeoJSON.FeatureCollection = { type: 'FeatureCollection', features: [] }

// Focused delivery's full OSRM route. Stored as [lat, lng][]; converted to [lng, lat] for GeoJSON.
// Also renders pickup (green) and dropoff (amber) pin markers at the route endpoints.
export default function RoutePolyline() {
    const polyline = useFocusStore((s) => s.routePolyline)
    const pickupCoord = useFocusStore((s) => s.pickupCoord)
    const dropoffCoord = useFocusStore((s) => s.dropoffCoord)

    const data: GeoJSON.FeatureCollection = useMemo(() => {
        const empty: GeoJSON.FeatureCollection = { type: 'FeatureCollection', features: [] }
        if (!Array.isArray(polyline) || polyline.length < 2) return empty
        // Guard against malformed points so a bad payload can never crash the map.
        const coordinates = polyline
            .filter((p): p is [number, number] => Array.isArray(p) && p.length >= 2)
            .map(([lat, lng]) => [lng, lat])
        if (coordinates.length < 2) return empty
        return {
            type: 'FeatureCollection',
            features: [{
                type: 'Feature',
                geometry: { type: 'LineString', coordinates },
                properties: {},
            }],
        }
    }, [polyline])

    const pickupGeoJSON: GeoJSON.FeatureCollection = useMemo(() => {
        if (!pickupCoord) return EMPTY_FC
        return {
            type: 'FeatureCollection',
            features: [{
                type: 'Feature',
                geometry: { type: 'Point', coordinates: [pickupCoord[1], pickupCoord[0]] },
                properties: {},
            }],
        }
    }, [pickupCoord])

    const dropoffGeoJSON: GeoJSON.FeatureCollection = useMemo(() => {
        if (!dropoffCoord) return EMPTY_FC
        return {
            type: 'FeatureCollection',
            features: [{
                type: 'Feature',
                geometry: { type: 'Point', coordinates: [dropoffCoord[1], dropoffCoord[0]] },
                properties: {},
            }],
        }
    }, [dropoffCoord])

    const hasRoute = data.features.length > 0

    return (
        <>
            <Source id="focus-route" type="geojson" data={data}>
                <Layer
                    id="focus-route-line"
                    type="line"
                    paint={{
                        'line-color': APP_CONFIG.map.routePolyline.color,
                        'line-width': APP_CONFIG.map.routePolyline.weight,
                        'line-opacity': APP_CONFIG.map.routePolyline.opacity,
                        'line-dasharray': [8, 8],
                    }}
                    layout={{ 'line-cap': 'round', 'line-join': 'round' }}
                />
            </Source>

            {hasRoute && pickupGeoJSON.features.length > 0 && (
                <Source id="focus-pickup" type="geojson" data={pickupGeoJSON}>
                    <Layer id="focus-pickup-ring" type="circle"
                           paint={{ 'circle-radius': 9, 'circle-color': 'transparent', 'circle-stroke-width': 2.5, 'circle-stroke-color': '#22c55e' }} />
                    <Layer id="focus-pickup-dot" type="circle"
                           paint={{ 'circle-radius': 5, 'circle-color': '#22c55e', 'circle-stroke-width': 1.5, 'circle-stroke-color': '#ffffff' }} />
                </Source>
            )}

            {hasRoute && dropoffGeoJSON.features.length > 0 && (
                <Source id="focus-dropoff" type="geojson" data={dropoffGeoJSON}>
                    <Layer id="focus-dropoff-ring" type="circle"
                           paint={{ 'circle-radius': 9, 'circle-color': 'transparent', 'circle-stroke-width': 2.5, 'circle-stroke-color': '#f59e0b' }} />
                    <Layer id="focus-dropoff-dot" type="circle"
                           paint={{ 'circle-radius': 5, 'circle-color': '#f59e0b', 'circle-stroke-width': 1.5, 'circle-stroke-color': '#ffffff' }} />
                </Source>
            )}
        </>
    )
}
