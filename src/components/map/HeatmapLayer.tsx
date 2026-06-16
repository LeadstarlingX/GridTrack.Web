import { GeoJSON, useMap } from 'react-leaflet'
import { useMemo, useEffect } from 'react'
import L from 'leaflet'
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

function HeatmapLegend() {
    const map = useMap()
    useEffect(() => {
        const { heatmap } = APP_CONFIG
        const legend = L.control({ position: 'bottomright' })
        legend.onAdd = () => {
            const div = L.DomUtil.create('div')
            div.style.cssText =
                'background:rgba(17,24,39,0.88);border:1px solid rgba(255,255,255,0.12);border-radius:8px;padding:10px 12px;font-size:11px;color:#e5e7eb;min-width:110px;'
            div.innerHTML = `
                <div style="font-weight:600;margin-bottom:7px;letter-spacing:0.04em;color:#f9fafb;">Deliveries</div>
                <div style="display:flex;flex-direction:column;gap:4px;">
                    <div style="display:flex;align-items:center;gap:7px;"><span style="width:12px;height:12px;border-radius:3px;display:inline-block;background:${heatmap.colors.low};flex-shrink:0;"></span>1–${heatmap.lowThreshold}</div>
                    <div style="display:flex;align-items:center;gap:7px;"><span style="width:12px;height:12px;border-radius:3px;display:inline-block;background:${heatmap.colors.medium};flex-shrink:0;"></span>${heatmap.lowThreshold + 1}–${heatmap.mediumThreshold}</div>
                    <div style="display:flex;align-items:center;gap:7px;"><span style="width:12px;height:12px;border-radius:3px;display:inline-block;background:${heatmap.colors.high};flex-shrink:0;"></span>${heatmap.mediumThreshold + 1}–${heatmap.highThreshold}</div>
                    <div style="display:flex;align-items:center;gap:7px;"><span style="width:12px;height:12px;border-radius:3px;display:inline-block;background:${heatmap.colors.extreme};flex-shrink:0;"></span>${heatmap.highThreshold + 1}+</div>
                </div>
            `
            return div
        }
        legend.addTo(map)
        return () => { legend.remove() }
    }, [map])
    return null
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

    // Computed once when the GeoJSON or district list loads — O(features × districts)
    const featureDistrictIds = useMemo(() => {
        if (!heatmapGeoJSON) return null
        return heatmapGeoJSON.features.map((f) => {
            if (f.geometry.type !== 'Polygon') return ''
            const coords = f.geometry.coordinates[0][0] as number[]
            return nearestDistrict(coords[1], coords[0], allDistricts)
        })
    }, [heatmapGeoJSON, allDistricts])

    // Fast path — O(features) lookup per tick using pre-computed ids
    const colored = useMemo(() => {
        if (!heatmapGeoJSON || !featureDistrictIds) return null
        return {
            ...heatmapGeoJSON,
            features: heatmapGeoJSON.features.map((f, i) => ({
                ...f,
                properties: {
                    ...f.properties,
                    intensity: deliveryCounts[featureDistrictIds[i]] ?? 0,
                },
            })),
        }
    }, [heatmapGeoJSON, featureDistrictIds, deliveryCounts])

    if (!enabled || !colored) return null

    return (
        <>
            <GeoJSON
                data={colored}
                style={(feature) => {
                    const v = feature?.properties?.intensity ?? 0
                    return { color: 'transparent', weight: 0, fillColor: getColor(v), fillOpacity: 0.55 }
                }}
                interactive={false}
            />
            <HeatmapLegend />
        </>
    )
}
