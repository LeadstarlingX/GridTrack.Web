import { Source, Layer } from 'react-map-gl/maplibre'
import { useMapStore } from '@/store/mapStore'

// Source data is fed imperatively by LiveMap's liveStore subscription.
// This component only declares the Source + Layer; LiveMap drives the data.
const EMPTY_FC: GeoJSON.FeatureCollection = { type: 'FeatureCollection', features: [] }

export default function DriverTrailLayer() {
    const trailEnabled = useMapStore((s) => s.trailEnabled)

    if (!trailEnabled) return null

    return (
        <Source id="driver-trail" type="geojson" data={EMPTY_FC}>
            <Layer
                id="driver-trail-line"
                type="line"
                paint={{
                    'line-color': [
                        'case',
                        ['boolean', ['feature-state', 'stalled'], false], '#f97316',
                        '#3b82f6',
                    ],
                    'line-width': 2.5,
                    'line-opacity': 0.7,
                    'line-dasharray': [6, 4],
                }}
                layout={{ 'line-cap': 'round', 'line-join': 'round' }}
            />
        </Source>
    )
}
