import { Source, Layer } from 'react-map-gl/maplibre'
import { useMapStore } from '@/store/mapStore'
import { useLiveStore } from '@/store/liveStore'

// Source data is fed imperatively by LiveMap's liveStore subscription.
// This component only declares the Source + Layer; LiveMap drives the data.
const EMPTY_FC: GeoJSON.FeatureCollection = { type: 'FeatureCollection', features: [] }

export default function DriverTrailLayer() {
    const trailEnabled = useMapStore((s) => s.trailEnabled)
    const selectedDriverId = useMapStore((s) => s.selectedDriverId)
    const sidePanelMode = useMapStore((s) => s.sidePanelMode)

    // When a plain click selects an in-transit driver, SelectedDeliveryRouteLayer takes over
    // with the solid pickup→drop route + pins. The dashed "behind the driver" trail would
    // just clutter that view, so suppress it for exactly the same condition that layer uses.
    const hasInTransitDelivery = useLiveStore((s) =>
        sidePanelMode === 'driver' && selectedDriverId
            ? Object.values(s.deliveries).some(
                (d) => d.assignedDriverId === selectedDriverId && d.status === 'InTransit',
            )
            : false,
    )

    if (!trailEnabled || hasInTransitDelivery) return null

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
