import { GeoJSON } from 'react-leaflet'
import { useMemo } from 'react'
import { useMapStore } from '@/store/mapStore'

const unselectedStyle = {
    color: '#64748b',
    weight: 1,
    fillColor: '#64748b',
    fillOpacity: 0.03,
    opacity: 0.35,
}

const selectedStyle = {
    color: '#3b82f6',
    weight: 2.5,
    fillColor: '#3b82f6',
    fillOpacity: 0.06,
    opacity: 0.9,
}

export default function DistrictBoundaryLayer() {
    const boundaries = useMapStore((s) => s.districtBoundariesGeoJSON)
    const selectedDistrictId = useMapStore((s) => s.selectedDistrictId)

    const selectedFeatureCollection = useMemo(() => {
        if (!boundaries || !selectedDistrictId) return null
        const feature = boundaries.features.find((f) => {
            const id = f.properties?.boundaryId ?? String(f.properties?.osm_id ?? '')
            return id === selectedDistrictId
        })
        if (!feature) return null
        return {
            ...boundaries,
            features: [feature],
        }
    }, [boundaries, selectedDistrictId])

    if (!boundaries) return null

    return (
        <>
            <GeoJSON
                key={`boundaries-${selectedDistrictId ?? 'none'}`}
                data={boundaries}
                interactive={false}
                style={(feature) => {
                    const id = feature?.properties?.boundaryId ?? String(feature?.properties?.osm_id ?? '')
                    return id && id === selectedDistrictId ? selectedStyle : unselectedStyle
                }}
            />
            {selectedFeatureCollection && (
                <GeoJSON
                    key={`selected-${selectedDistrictId}`}
                    data={selectedFeatureCollection}
                    style={selectedStyle}
                    interactive={false}
                />
            )}
        </>
    )
}
