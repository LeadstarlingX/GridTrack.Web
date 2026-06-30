import { Source, Layer } from 'react-map-gl/maplibre'
import { useMemo } from 'react'
import { useMapStore } from '@/store/mapStore'
import { useH3Density } from '@/lib/api/queries/useH3Density'
import type { H3DensityQueryParams } from '@/types/api'

function percentile(values: number[], p: number) {
    if (values.length === 0) return 0
    const sorted = [...values].sort((a, b) => a - b)
    return sorted[Math.floor((p / 100) * (sorted.length - 1))]
}

// Warm "heat" ramp — denser pickup areas burn hotter (yellow → orange → deep red).
function heatStep(v: number, p25: number, p50: number, p75: number): string {
    if (v > p75) return '#b30000'
    if (v > p50) return '#fc8d59'
    if (v > p25) return '#fdcc8a'
    return '#fef0d9'
}

export default function HistoricalHeatmapLayer() {
    const enabled      = useMapStore((s) => s.historicalHeatmapEnabled)
    const heatmapGeoJSON = useMapStore((s) => s.heatmapGeoJSON)
    const range        = useMapStore((s) => s.historicalHeatmapRange)
    const hexResolution = useMapStore((s) => s.hexResolution)

    const densityParams: H3DensityQueryParams | null = range
        ? { from: range.from, to: range.to, resolution: hexResolution, fromHour: range.fromHour, toHour: range.toHour }
        : null

    const { data: densityData } = useH3Density(densityParams)

    const countMap = useMemo<Record<string, number>>(() => {
        if (!densityData) return {}
        return Object.fromEntries(densityData.cells.map((c) => [c.h3Index, c.deliveryCount]))
    }, [densityData])

    const { colored, thresholds } = useMemo(() => {
        if (!heatmapGeoJSON || !range) return { colored: null, thresholds: null }

        const features = heatmapGeoJSON.features.map((f) => {
            if (f.geometry.type !== 'Polygon') return f
            const h3Index = f.properties?.h3Index ?? ''
            const intensity = countMap[h3Index] ?? 0
            return { ...f, properties: { ...f.properties, intensity } }
        })

        // Percentiles over cells that actually have activity, not the full city grid — most of
        // the ~900 grid cells are empty, so including them collapses p25/p50/p75 to 0. MapLibre's
        // `step` expression requires strictly ascending stops, so duplicate 0 stops make the
        // layer fail to render at all (not just look flat).
        const active = Object.values(countMap).filter((v) => v > 0).sort((a, b) => a - b)
        let p25 = percentile(active, 25)
        let p50 = percentile(active, 50)
        let p75 = percentile(active, 75)
        if (p50 <= p25) p50 = p25 + 1
        if (p75 <= p50) p75 = p50 + 1

        return {
            colored: { ...heatmapGeoJSON, features } as GeoJSON.FeatureCollection,
            thresholds: { p25, p50, p75 },
        }
    }, [heatmapGeoJSON, range, countMap])

    if (!enabled || !colored || !thresholds) return null

    return (
        <>
            <Source id="h3-historical" type="geojson" data={colored}>
                <Layer
                    id="h3-historical-fill"
                    type="fill"
                    paint={{
                        'fill-color': [
                            'step', ['get', 'intensity'],
                            '#fef0d9',
                            thresholds.p25, '#fdcc8a',
                            thresholds.p50, '#fc8d59',
                            thresholds.p75, '#b30000',
                        ],
                        'fill-opacity': 0.6,
                    }}
                />
            </Source>

            {/* Legend overlay — plain React div, not a map layer */}
            <div className="pointer-events-none absolute bottom-20 right-4 z-[1000]">
                <div className="space-y-1 rounded-md border border-[hsl(var(--border))] bg-[hsl(var(--surface))]/95 px-3 py-2 text-[11px] shadow-lg backdrop-blur-sm">
                    <div className="text-[12px] font-medium text-[hsl(var(--foreground))]">
                        Pickup density (percentiles)
                    </div>
                    {[
                        { label: `Low < p25 (${thresholds.p25})`,          value: thresholds.p25 - 1 },
                        { label: `Medium p25–p50 (${thresholds.p50})`,      value: thresholds.p50 - 1 },
                        { label: `High p50–p75 (${thresholds.p75})`,        value: thresholds.p75 - 1 },
                        { label: 'Very high > p75',                          value: thresholds.p75 + 1 },
                    ].map((item) => (
                        <div key={item.label} className="flex items-center gap-2 text-[hsl(var(--foreground-muted))] text-[11px]">
                            <span
                                className="h-3 w-6 rounded-sm"
                                style={{ backgroundColor: heatStep(item.value, thresholds.p25, thresholds.p50, thresholds.p75) }}
                            />
                            <span>{item.label}</span>
                        </div>
                    ))}
                </div>
            </div>
        </>
    )
}
