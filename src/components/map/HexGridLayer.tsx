import { GeoJSON } from 'react-leaflet'
import { APP_CONFIG } from '@/config/app.config'
import { useMapStore } from '@/store/mapStore'
import { getDistrictForCoords } from '@/constants/mockData'

export default function HexGridLayer() {
    const hexGeoJSON = useMapStore((s) => s.hexGeoJSON)
    const enabled = useMapStore((s) => s.hexGridEnabled)
    const selectDistrict = useMapStore((s) => s.selectDistrict)

    if (!enabled || !hexGeoJSON) return null

    return (
        <GeoJSON
            data={hexGeoJSON}
            style={{
                color: '#475569',
                weight: 1.25,
                fillColor: '#3b82f6',
                fillOpacity: 0.1,
            }}
            onEachFeature={(feature, layer) => {
                layer.on('click', () => {
                    const coords = feature.geometry.type === 'Polygon'
                        ? feature.geometry.coordinates[0][0]
                        : APP_CONFIG.map.center
                    const district = getDistrictForCoords(coords[1], coords[0])
                    selectDistrict(district.id)
                })
            }}
        />
    )
}