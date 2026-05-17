import { GeoJSON } from 'react-leaflet'
import { useMapStore } from '@/store/mapStore'

function getColor(value: number): string {
    if (value > 8) return '#ef4444'
    if (value > 5) return '#f59e0b'
    if (value > 2) return '#eab308'
    return '#22c55e'
}

export default function HeatmapLayer() {
    const hexGeoJSON = useMapStore((s) => s.hexGeoJSON)
    const enabled = useMapStore((s) => s.heatmapEnabled)

    if (!enabled || !hexGeoJSON) return null

    const colored = {
        ...hexGeoJSON,
        features: hexGeoJSON.features.map((f) => ({
            ...f,
            properties: {
                ...f.properties,
                intensity: Math.floor(Math.random() * 12),
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
                    fillOpacity: 0.4,
                }
            }}
            interactive={false}
        />
    )
}