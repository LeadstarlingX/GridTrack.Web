import { Source, Layer } from 'react-map-gl/maplibre'
import { useMemo } from 'react'
import { useMapStore } from '@/store/mapStore'

export default function DistrictBoundaryLayer() {
    const boundaries       = useMapStore((s) => s.districtBoundariesGeoJSON)
    const selectedDistrictId = useMapStore((s) => s.selectedDistrictId)

    const selectedFC = useMemo(() => {
        if (!boundaries || !selectedDistrictId) return null
        const feature = boundaries.features.find((f) => {
            const id = f.properties?.boundaryId ?? String(f.properties?.osm_id ?? '')
            return id === selectedDistrictId
        })
        return feature ? { ...boundaries, features: [feature] } : null
    }, [boundaries, selectedDistrictId])

    if (!boundaries) return null

    return (
        <>
            {/* All boundaries — subtle */}
            <Source id="district-boundaries" type="geojson" data={boundaries}>
                <Layer
                    id="district-fill"
                    type="fill"
                    paint={{ 'fill-color': '#64748b', 'fill-opacity': 0.03 }}
                />
                <Layer
                    id="district-line"
                    type="line"
                    paint={{ 'line-color': '#64748b', 'line-width': 1, 'line-opacity': 0.35 }}
                />
            </Source>

            {/* Selected district — highlighted */}
            {selectedFC && (
                <Source id="district-selected" type="geojson" data={selectedFC as GeoJSON.FeatureCollection}>
                    <Layer
                        id="district-selected-fill"
                        type="fill"
                        paint={{ 'fill-color': '#3b82f6', 'fill-opacity': 0.06 }}
                    />
                    <Layer
                        id="district-selected-line"
                        type="line"
                        paint={{ 'line-color': '#3b82f6', 'line-width': 2.5, 'line-opacity': 0.9 }}
                    />
                </Source>
            )}
        </>
    )
}
