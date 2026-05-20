import { GeoJSON } from 'react-leaflet'
import { useMemo } from 'react'
import { useMapStore } from '@/store/mapStore'
import { useH3Density } from '@/lib/api/queries/useH3Density'
import { getMockHistoricalHeatmapCount } from '@/constants/mockData'
import type { H3DensityQueryParams } from '@/types/api'

const USE_MOCK = import.meta.env.VITE_USE_MOCK_SIGNALR === 'true'

function percentile(values: number[], p: number) {
    if (values.length === 0) return 0
    const sorted = [...values].sort((a, b) => a - b)
    return sorted[Math.floor((p / 100) * (sorted.length - 1))]
}

function getBlueScale(value: number, p25: number, p50: number, p75: number) {
    if (value > p75) return '#1d4ed8'
    if (value > p50) return '#3b82f6'
    if (value > p25) return '#93c5fd'
    return '#dbeafe'
}

export default function HistoricalHeatmapLayer() {
    const enabled = useMapStore((s) => s.historicalHeatmapEnabled)
    const heatmapGeoJSON = useMapStore((s) => s.heatmapGeoJSON)
    const range = useMapStore((s) => s.historicalHeatmapRange)
    const hexResolution = useMapStore((s) => s.hexResolution)

    const densityParams: H3DensityQueryParams | null = !USE_MOCK && range
        ? { from: range.from, to: range.to, resolution: hexResolution, fromHour: range.fromHour, toHour: range.toHour }
        : null

    const { data: densityData } = useH3Density(densityParams)

    const countMap = useMemo<Record<string, number>>(() => {
        if (USE_MOCK || !densityData) return {}
        return Object.fromEntries(densityData.cells.map((c) => [c.h3Index, c.deliveryCount]))
    }, [densityData])

    const { colored, thresholds } = useMemo(() => {
        if (!heatmapGeoJSON || !range) return { colored: null, thresholds: null }

        const features = heatmapGeoJSON.features.map((feature) => {
            if (feature.geometry.type !== 'Polygon') return feature
            const h3Index = feature.properties?.h3Index ?? ''
            const intensity = USE_MOCK
                ? getMockHistoricalHeatmapCount(h3Index, range)
                : (countMap[h3Index] ?? 0)
            return { ...feature, properties: { ...feature.properties, intensity } }
        })

        const values = features.map((f) => (f as GeoJSON.Feature).properties?.intensity ?? 0)
        const p25 = percentile(values, 25)
        const p50 = percentile(values, 50)
        const p75 = percentile(values, 75)

        return { colored: { ...heatmapGeoJSON, features }, thresholds: { p25, p50, p75 } }
    }, [heatmapGeoJSON, range, countMap])

    if (!enabled || !colored || !thresholds) return null

    return (
        <>
            <GeoJSON
                data={colored}
                style={(feature) => {
                    const v = feature?.properties?.intensity ?? 0
                    return {
                        color: 'transparent',
                        weight: 0,
                        fillColor: getBlueScale(v, thresholds.p25, thresholds.p50, thresholds.p75),
                        fillOpacity: 0.5,
                    }
                }}
                interactive={false}
            />
            <div className="pointer-events-none absolute bottom-20 right-4 z-[1000]">
                <div className="space-y-1 rounded-md border border-[hsl(var(--border))] bg-[hsl(var(--surface))]/95 px-3 py-2 text-[11px] shadow-lg backdrop-blur-sm">
                    <div className="text-[12px] font-medium text-[hsl(var(--foreground))]">
                        Historical heat (percentiles)
                    </div>
                    {[
                        { label: `Low < p25 (${thresholds.p25})`, value: thresholds.p25 - 1 },
                        { label: `Medium p25–p50 (${thresholds.p50})`, value: thresholds.p50 - 1 },
                        { label: `High p50–p75 (${thresholds.p75})`, value: thresholds.p75 - 1 },
                        { label: `Very high > p75`, value: thresholds.p75 + 1 },
                    ].map((item) => (
                        <div key={item.label} className="flex items-center gap-2 text-[hsl(var(--foreground-muted))] text-[11px]">
                            <span
                                className="h-3 w-6 rounded-sm"
                                style={{ backgroundColor: getBlueScale(item.value, thresholds.p25, thresholds.p50, thresholds.p75) }}
                            />
                            <span>{item.label}</span>
                        </div>
                    ))}
                </div>
            </div>
        </>
    )
}
