import { GeoJSON } from 'react-leaflet'
import { useMemo } from 'react'
import { APP_CONFIG } from '@/config/app.config'
import { useMapStore } from '@/store/mapStore'
import { useLiveStore } from '@/store/liveStore'
import { useDistricts } from '@/lib/api/queries/useDistricts'
import type { DistrictDto } from '@/types/api'

function nearestDistrict(lat: number, lng: number, districts: DistrictDto[]): string {
    if (districts.length === 0) return ''
    let best = districts[0]
    let bestDist = Infinity
    for (const d of districts) {
        const dist = Math.hypot(lat - d.centroid.lat, lng - d.centroid.lng)
        if (dist < bestDist) { bestDist = dist; best = d }
    }
    return best.id
}

function getColor(value: number): string {
    if (value > APP_CONFIG.heatmap.highThreshold) return APP_CONFIG.heatmap.colors.extreme
    if (value > APP_CONFIG.heatmap.mediumThreshold) return APP_CONFIG.heatmap.colors.high
    if (value > APP_CONFIG.heatmap.lowThreshold) return APP_CONFIG.heatmap.colors.medium
    return APP_CONFIG.heatmap.colors.low
}

export default function HeatmapLayer() {
    const heatmapGeoJSON = useMapStore((s) => s.heatmapGeoJSON)
    const enabled = useMapStore((s) => s.heatmapEnabled)
    const deliveries = useLiveStore((s) => s.deliveries)
    const { data: allDistricts = [] } = useDistricts()

    const deliveryCounts = useMemo(() => {
        const counts: Record<string, number> = {}
        for (const d of Object.values(deliveries)) {
            if (d.districtId) counts[d.districtId] = (counts[d.districtId] ?? 0) + 1
        }
        return counts
    }, [deliveries])

    const colored = useMemo(() => {
        if (!heatmapGeoJSON) return null
        return {
            ...heatmapGeoJSON,
            features: heatmapGeoJSON.features.map((f) => ({
                ...f,
                properties: {
                    ...f.properties,
                    intensity: (() => {
                        if (f.geometry.type !== 'Polygon') return 0
                        const coords = f.geometry.coordinates[0][0] as number[]
                        const districtId = nearestDistrict(coords[1], coords[0], allDistricts)
                        return deliveryCounts[districtId] ?? 0
                    })(),
                },
            })),
        }
    }, [heatmapGeoJSON, deliveryCounts, allDistricts])

    if (!enabled || !colored) return null

    return (
        <GeoJSON
            data={colored}
            style={(feature) => {
                const v = feature?.properties?.intensity ?? 0
                return { color: 'transparent', weight: 0, fillColor: getColor(v), fillOpacity: 0.55 }
            }}
            interactive={false}
        />
    )
}
