import { useMemo } from 'react'
import { Source, Layer, Marker } from 'react-map-gl/maplibre'
import { useFocusStore } from '@/store/focusStore'
import { APP_CONFIG } from '@/config/app.config'

const EMPTY_FC: GeoJSON.FeatureCollection = { type: 'FeatureCollection', features: [] }

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

export default function RoutePolyline() {
    const polyline     = useFocusStore((s) => s.routePolyline)
    const pickupCoord  = useFocusStore((s) => s.pickupCoord)
    const dropoffCoord = useFocusStore((s) => s.dropoffCoord)

    const data: GeoJSON.FeatureCollection = useMemo(() => {
        if (!Array.isArray(polyline) || polyline.length < 2) return EMPTY_FC
        const coordinates = polyline
            .filter((p): p is [number, number] => Array.isArray(p) && p.length >= 2)
            .map(([lat, lng]) => [lng, lat])
        if (coordinates.length < 2) return EMPTY_FC
        return {
            type: 'FeatureCollection',
            features: [{ type: 'Feature', geometry: { type: 'LineString', coordinates }, properties: {} }],
        }
    }, [polyline])

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

            {hasRoute && pickupCoord && (
                <Marker longitude={pickupCoord[1]} latitude={pickupCoord[0]} anchor="bottom">
                    <GpsPin color="#22c55e" />
                </Marker>
            )}

            {hasRoute && dropoffCoord && (
                <Marker longitude={dropoffCoord[1]} latitude={dropoffCoord[0]} anchor="bottom">
                    <GpsPin color="#f59e0b" />
                </Marker>
            )}
        </>
    )
}