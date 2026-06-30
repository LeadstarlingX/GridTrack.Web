import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { useMapStore } from '@/store/mapStore'
import { useForecast } from '@/lib/api/queries/useForecast'
import { useDistrictSparkline } from '@/lib/api/queries/useDistrictSparkline'
import { useDistrictSummary } from '@/lib/api/queries/useDistrictSummary'
import { useDistrictDemandForecast } from '@/lib/api/queries/useDistrictDemandForecast'
import { AreaChart, Area, Tooltip, ResponsiveContainer, XAxis } from 'recharts'
import { format } from 'date-fns'

function SparklineChart({ districtId }: { districtId: string }) {
    const { data, isLoading } = useDistrictSparkline(districtId)

    if (isLoading) {
        return <Skeleton className="h-14 w-full" />
    }

    if (!data?.length) {
        return <p className="py-3 text-center text-xs text-[hsl(var(--foreground-muted))]">No trend data yet.</p>
    }

    const chartData = data.map((p) => ({
        hour: format(new Date(p.hour), 'HH:mm'),
        count: p.count,
    }))

    return (
        <ResponsiveContainer width="100%" height={56}>
            <AreaChart data={chartData} margin={{ top: 4, bottom: 0, left: 0, right: 0 }}>
                <XAxis dataKey="hour" hide />
                <Tooltip
                    contentStyle={{ background: 'hsl(var(--surface))', border: '1px solid hsl(var(--border))', borderRadius: 6, fontSize: 11 }}
                    formatter={(v) => [`${v} deliveries`, '']}
                />
                <Area type="monotone" dataKey="count" stroke="hsl(var(--primary))" fill="hsl(var(--primary) / 0.15)" strokeWidth={1.5} dot={false} />
            </AreaChart>
        </ResponsiveContainer>
    )
}

function formatStaleness(cachedAt: string) {
    const diffMin = Math.floor((Date.now() - new Date(cachedAt).getTime()) / 60_000)
    if (diffMin < 1) return 'just now'
    if (diffMin === 1) return '1 min ago'
    return `${diffMin} min ago`
}

export default function DistrictPanel() {
    const boundaryId = useMapStore((s) => s.selectedDistrictId)
    const boundaries = useMapStore((s) => s.districtBoundariesGeoJSON)
    const setMode = useMapStore((s) => s.setSidePanelMode)

    const { data: forecast, isLoading: forecastLoading } = useForecast(boundaryId)
    const { data: districtSummary } = useDistrictSummary(boundaryId)
    const { data: demandForecast, isLoading: demandForecastLoading } = useDistrictDemandForecast({ hoursAhead: 1 })

    if (!boundaryId) return null

    const nextHourPredicted = demandForecast?.items.find((i) => i.districtId === boundaryId)?.predictedDeliveries

    const boundaryMatch = boundaries?.features?.find((feature) => {
        const featureId = feature.properties?.boundaryId ?? String(feature.properties?.osm_id ?? '')
        return featureId === boundaryId
    })
    const displayName = (
        boundaryMatch?.properties?.displayName ??
        boundaryMatch?.properties?.name_fixed ??
        boundaryMatch?.properties?.name ??
        boundaryId
    ) as string

    return (
        <div className="p-4">
            <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-lg">{displayName}</h2>
                <Button variant="ghost" size="icon" onClick={() => setMode('idle')}>
                    <X className="h-4 w-4" />
                </Button>
            </div>
            <div className="space-y-3">
                <Card>
                    <CardHeader className="pb-1"><CardTitle className="text-sm">Demand (last 6 h)</CardTitle></CardHeader>
                    <CardContent className="pt-0 pb-3">
                        {forecastLoading ? (
                            <Skeleton className="mb-2 h-8 w-16" />
                        ) : (
                            <p className="text-2xl font-bold mb-2">{forecast?.forecastedDemand ?? '—'}</p>
                        )}
                        <SparklineChart districtId={boundaryId} />
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-1"><CardTitle className="text-sm">Predicted (next hour)</CardTitle></CardHeader>
                    <CardContent className="pt-0 pb-3">
                        {demandForecastLoading ? (
                            <Skeleton className="h-8 w-16" />
                        ) : (
                            <p className="text-2xl font-bold">
                                {nextHourPredicted !== undefined ? nextHourPredicted.toFixed(1) : '—'}
                            </p>
                        )}
                        <p className="mt-1 text-[11px] text-[hsl(var(--foreground-muted))]">
                            28-day historical average for this hour/day-of-week.
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2"><CardTitle className="text-sm">Boundary ID</CardTitle></CardHeader>
                    <CardContent><p className="text-2xl font-bold font-mono text-sm">{boundaryId}</p></CardContent>
                </Card>
                {(forecast?.staffingRatio !== undefined || forecastLoading) && (
                    <Card>
                        <CardHeader className="pb-2"><CardTitle className="text-sm">Staffing Ratio</CardTitle></CardHeader>
                        <CardContent>
                            {forecastLoading
                                ? <Skeleton className="h-8 w-16" />
                                : <p className="text-2xl font-bold">{forecast!.staffingRatio.toFixed(2)}</p>
                            }
                        </CardContent>
                    </Card>
                )}
                {(forecast?.driverRecommendation !== undefined || forecastLoading) && (
                    <Card>
                        <CardHeader className="pb-2"><CardTitle className="text-sm">Recommended Drivers</CardTitle></CardHeader>
                        <CardContent>
                            {forecastLoading
                                ? <Skeleton className="h-8 w-12" />
                                : <p className="text-2xl font-bold">{forecast!.driverRecommendation}</p>
                            }
                        </CardContent>
                    </Card>
                )}
                {districtSummary && (
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm flex items-center justify-between gap-2">
                                <span>AI Summary</span>
                                {districtSummary.cachedAt && (
                                    <span className="text-[10px] font-normal text-[hsl(var(--foreground-muted))] shrink-0">
                                        Stale · {formatStaleness(districtSummary.cachedAt)}
                                    </span>
                                )}
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-xs text-[hsl(var(--foreground-muted))] leading-relaxed">
                                {districtSummary.summary}
                            </p>
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    )
}
