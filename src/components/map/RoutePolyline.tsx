import { useMemo } from 'react'
import { Source, Layer } from 'react-map-gl/maplibre'
import { useFocusStore } from '@/store/focusStore'
import { APP_CONFIG } from '@/config/app.config'

// Focused delivery's full OSRM route. Stored as [lat, lng][]; converted to [lng, lat] for GeoJSON.
export default function RoutePolyline() {
    const polyline = useFocusStore((s) => s.routePolyline)

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

    return (
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
    )
}
