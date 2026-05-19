import { GeoJSON } from 'react-leaflet'
import L from 'leaflet'
import { useMapStore } from '@/store/mapStore'
import { getMapRef } from '@/lib/mapRef'

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
    const selectDistrict = useMapStore((s) => s.selectDistrict)
    const setSidePanelMode = useMapStore((s) => s.setSidePanelMode)

    if (!boundaries) return null

    return (
        <GeoJSON
            data={boundaries}
            style={(feature) => {
                const id = feature?.properties?.boundaryId ?? String(feature?.properties?.osm_id ?? '')
                return id && id === selectedDistrictId ? selectedStyle : unselectedStyle
            }}
            onEachFeature={(feature, layer) => {
                layer.on('click', () => {
                    const id = feature.properties?.boundaryId ?? String(feature.properties?.osm_id ?? '')
                    if (!id) return
                    selectDistrict(id)
                    setSidePanelMode('district')
                    const map = getMapRef()
                    if (map) {
                        const bounds = L.geoJSON(feature as any).getBounds()
                        if (bounds.isValid()) {
                            map.fitBounds(bounds, { padding: [32, 32], maxZoom: 15 })
                        }
                    }
                })
            }}
        />
    )
}
