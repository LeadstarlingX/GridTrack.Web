import { GeoJSON } from 'react-leaflet'
import { APP_CONFIG } from '@/config/app.config'
import { useMapStore } from '@/store/mapStore'
import { MOCK_DELIVERIES, getDistrictForCoords } from '@/constants/mockData'

function getColor(value: number): string {
    if (value > APP_CONFIG.heatmap.highThreshold) return APP_CONFIG.heatmap.colors.extreme
    if (value > APP_CONFIG.heatmap.mediumThreshold) return APP_CONFIG.heatmap.colors.high
    if (value > APP_CONFIG.heatmap.lowThreshold) return APP_CONFIG.heatmap.colors.medium
    return APP_CONFIG.heatmap.colors.low
}

export default function HeatmapLayer() {
    const heatmapGeoJSON = useMapStore((s) => s.heatmapGeoJSON)
    const enabled = useMapStore((s) => s.heatmapEnabled)

    if (!enabled || !heatmapGeoJSON) return null

    const deliveryCounts = MOCK_DELIVERIES.reduce<Record<string, number>>((acc, delivery) => {
        acc[delivery.districtId] = (acc[delivery.districtId] ?? 0) + 1
        return acc
    }, {})

    const colored = {
        ...heatmapGeoJSON,
        features: heatmapGeoJSON.features.map((f) => ({
            ...f,
            properties: {
                ...f.properties,
                intensity: (() => {
                    if (f.geometry.type !== 'Polygon') return 0
                    const coords = f.geometry.coordinates[0][0]
                    const district = getDistrictForCoords(coords[1], coords[0])
                    return deliveryCounts[district.id] ?? 0
                })(),
            },
        })),
    }

    return (
        <GeoJSON
            data={colored}
            style={(feature) => {
                const v = feature?.properties?.intensity ?? 0
                return {
                    color: 'transparent',
                    weight: 0,
                    fillColor: getColor(v),
                    fillOpacity: 0.55,
                }
            }}
            interactive={false}
        />
    )
}