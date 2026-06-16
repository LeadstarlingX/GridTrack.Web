import { GeoJSON } from 'react-leaflet'
import { useMemo } from 'react'
import { APP_CONFIG } from '@/config/app.config'
import { useMapStore } from '@/store/mapStore'

interface RecommendationOverlayProps {
    computeRatio?: (boundaryId: string) => number | null
}

const legendItems = [
    { label: 'Severely understaffed', color: '#ef4444', range: '< 0.5' },
    { label: 'Understaffed', color: '#f59e0b', range: '0.5 - 0.85' },
    { label: 'Optimal', color: '#22c55e', range: '0.85 - 1.15' },
    { label: 'Overstaffed', color: '#6366f1', range: '> 1.15' },
] as const

function getRecommendationFill(ratio: number) {
    if (ratio < APP_CONFIG.recommendation.severelyUnderstaffedThreshold) return '#ef4444'
    if (ratio < APP_CONFIG.recommendation.understaffedThreshold) return '#f59e0b'
    if (ratio <= APP_CONFIG.recommendation.overstaffedThreshold) return '#22c55e'
    return '#6366f1'
}

export default function RecommendationOverlay({ computeRatio }: RecommendationOverlayProps) {
    const enabled = useMapStore((s) => s.recommendationEnabled)
    const boundaries = useMapStore((s) => s.districtBoundariesGeoJSON)
    const districtForecasts = useMapStore((s) => s.districtForecasts)

    const computeLocal = (boundaryId: string): number | null => {
        const forecast = districtForecasts[boundaryId]
        return forecast !== undefined ? forecast.staffingRatio : null
    }
    const compute = computeRatio ?? computeLocal

    const colored = useMemo(() => {
        if (!boundaries) return null

        return {
            ...boundaries,
            features: boundaries.features.map((feature) => {
                const boundaryId = feature.properties?.boundaryId ?? String(feature.properties?.osm_id ?? '')
                const staffingRatio = compute(boundaryId)

                return {
                    ...feature,
                    properties: {
                        ...feature.properties,
                        staffingRatio,
                    },
                }
            }),
        }
    }, [boundaries, computeRatio, districtForecasts])

    if (!enabled || !colored) return null

    return (
        <>
            <GeoJSON
                data={colored}
                interactive={false}
                style={(feature) => {
                    const staffingRatio = feature?.properties?.staffingRatio
                    if (staffingRatio == null) return { color: 'transparent', weight: 0, fillOpacity: 0 }
                    return {
                        color: 'transparent',
                        weight: 0,
                        fillColor: getRecommendationFill(staffingRatio),
                        fillOpacity: 0.45,
                    }
                }}
            />
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
