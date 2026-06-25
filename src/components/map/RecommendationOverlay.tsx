import { Source, Layer } from 'react-map-gl/maplibre'
import { useMemo } from 'react'
import { APP_CONFIG } from '@/config/app.config'
import { useMapStore } from '@/store/mapStore'

const legendItems = [
    { label: 'Severely understaffed', color: '#ef4444', range: '< 0.5' },
    { label: 'Understaffed',          color: '#f59e0b', range: '0.5–0.85' },
    { label: 'Optimal',               color: '#22c55e', range: '0.85–1.15' },
    { label: 'Overstaffed',           color: '#6366f1', range: '> 1.15' },
] as const

export default function RecommendationOverlay() {
    const enabled         = useMapStore((s) => s.recommendationEnabled)
    const boundaries      = useMapStore((s) => s.districtBoundariesGeoJSON)
    const districtForecasts = useMapStore((s) => s.districtForecasts)

    const colored = useMemo(() => {
        if (!boundaries) return null
        return {
            ...boundaries,
            features: boundaries.features.map((f) => {
                const boundaryId   = f.properties?.boundaryId ?? String(f.properties?.osm_id ?? '')
                const forecast     = districtForecasts[boundaryId]
                // -1 sentinel = no forecast data (null is not a valid MapLibre expression input)
                const staffingRatio = forecast?.staffingRatio ?? -1
                return { ...f, properties: { ...f.properties, staffingRatio } }
            }),
        } as GeoJSON.FeatureCollection
    }, [boundaries, districtForecasts])

    if (!enabled || !colored) return null

    return (
        <>
            <Source id="recommendation-overlay" type="geojson" data={colored}>
                <Layer
                    id="recommendation-fill"
                    type="fill"
                    paint={{
                        'fill-color': [
                            'case',
                            ['<', ['get', 'staffingRatio'], 0], 'transparent',
                            ['<', ['get', 'staffingRatio'], APP_CONFIG.recommendation.severelyUnderstaffedThreshold], '#ef4444',
                            ['<', ['get', 'staffingRatio'], APP_CONFIG.recommendation.understaffedThreshold],         '#f59e0b',
                            ['<=', ['get', 'staffingRatio'], APP_CONFIG.recommendation.overstaffedThreshold],         '#22c55e',
                            '#6366f1',
                        ],
                        'fill-opacity': [
                            'case',
                            ['<', ['get', 'staffingRatio'], 0], 0,
                            0.45,
                        ],
                    }}
                />
            </Source>

            <div className="pointer-events-none absolute bottom-4 right-4 z-[1000]">
                <div className="space-y-1 rounded-md border border-[hsl(var(--border))] bg-[hsl(var(--surface))]/95 px-3 py-2 text-[11px] shadow-lg backdrop-blur-sm">
                    {legendItems.map((item) => (
                        <div key={item.label} className="flex items-center gap-2 whitespace-nowrap text-[hsl(var(--foreground))]">
                            <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                            <span>{item.label}</span>
                            <span className="text-[hsl(var(--foreground-muted))]">{item.range}</span>
                        </div>
                    ))}
                </div>
            </div>
        </>
    )
}
