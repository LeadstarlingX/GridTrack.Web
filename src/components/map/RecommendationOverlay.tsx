import { GeoJSON } from 'react-leaflet'
import { useMemo } from 'react'
import { APP_CONFIG } from '@/config/app.config'
import { getMockRecommendationRatio, getMockDistrictStats } from '@/constants/mockData'
import { useMapStore } from '@/store/mapStore'

type ComputeRatio = (districtId: string, districtName?: string) => number

interface RecommendationOverlayProps {
    computeRatio?: ComputeRatio
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
    const recommendationMock = useMapStore((s) => s.recommendationMock)
    // computeRatio may be provided for unit tests; otherwise use local stub that prefers loaded mock forecasts
    const computeLocal = (districtId: string, districtName?: string) => {
        if (recommendationMock && recommendationMock[districtId] !== undefined) {
            const expected = recommendationMock[districtId]
            // derive active drivers from mock recommendation array or seeded district stats
            const seeded = getMockDistrictStats(districtId, districtName)
            const activeDrivers = Math.max(1, Math.round((seeded.activeDeliveries / 3)))
            return Number((activeDrivers / Math.max(1, expected)).toFixed(2))
        }
        return getMockRecommendationRatio(districtId, districtName)
    }
    const compute = computeRatio ?? computeLocal
    const selectDistrict = useMapStore((s) => s.selectDistrict)
    const setSidePanelMode = useMapStore((s) => s.setSidePanelMode)

    const colored = useMemo(() => {
        if (!boundaries) return null

        return {
            ...boundaries,
            features: boundaries.features.map((feature) => {
                const districtId = feature.properties?.districtId ?? ''
                const districtName = feature.properties?.name as string | undefined
                const staffingRatio = compute(districtId, districtName)

                return {
                    ...feature,
                    properties: {
                        ...feature.properties,
                        staffingRatio,
                    },
                }
            }),
        }
    }, [boundaries, computeRatio])

    if (!enabled || !colored) return null

    return (
        <>
            <GeoJSON
                data={colored}
                style={(feature) => {
                    const staffingRatio = feature?.properties?.staffingRatio ?? 0
                    return {
                        color: 'transparent',
                        weight: 0,
                        fillColor: getRecommendationFill(staffingRatio),
                        fillOpacity: 0.45,
                    }
                }}
                onEachFeature={(feature, layer) => {
                    layer.on('click', () => {
                        const districtId = feature.properties?.districtId
                        if (!districtId) return
                        selectDistrict(districtId)
                        setSidePanelMode('district')
                    })
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