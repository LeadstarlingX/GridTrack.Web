import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Skeleton } from '@/components/ui'
import DeliveryTrendChart from '@/components/charts/DeliveryTrendChart'
import AnomalyRateChart from '@/components/charts/AnomalyRateChart'
import DistrictVolumeChart from '@/components/charts/DistrictVolumeChart'
import DistrictDemandForecastChart from '@/components/charts/DistrictDemandForecastChart'
import StatusBreakdownChart from '@/components/charts/StatusBreakdownChart'
import UrgencyTrendChart from '@/components/charts/UrgencyTrendChart'
import { APP_CONFIG } from '@/config/app.config'
import { useDistricts } from '@/lib/api/queries/useDistricts'
import { useDistrictVolume } from '@/lib/api/queries/useDistrictVolume'
import { useDistrictDemandForecast } from '@/lib/api/queries/useDistrictDemandForecast'
import { useDriverAnalytics } from '@/lib/api/queries/useDriverAnalytics'
import { apiClient } from '@/lib/api/client'
import { useAnalyticsSummary } from '@/lib/api/queries/useAnalyticsSummary'
import { useAnalyticsTrends } from '@/lib/api/queries/useAnalyticsTrends'
import { useStatusBreakdown } from '@/lib/api/queries/useStatusBreakdown'
import { useSarimaDeliveryForecast } from '@/lib/api/queries/useSarimaDeliveryForecast'
import DateRangePicker, { type DateRangeValue } from './DateRangePicker'

// Date selection is driven entirely by the date-range picker; exports cover every
// day-of-week and the full 24h window rather than exposing those as extra filters.
const ALL_DAYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']
const FULL_HOUR_START = 0
const FULL_HOUR_END = 23

function formatPercent(value: number) {
    return `${Math.round(value * 100)}%`
}

function MetricCard({
    label,
    value,
    helper,
    isLoading,
}: {
    label: string
    value: string
    helper: string
    isLoading: boolean
}) {
    return (
        <Card>
            <CardHeader>
                <CardDescription className="text-xs text-[hsl(var(--foreground-muted))]">{label}</CardDescription>
                {isLoading ? (
                    <Skeleton className="h-7 w-24" />
                ) : (
                    <CardTitle className="text-2xl font-semibold text-[hsl(var(--foreground))]">{value}</CardTitle>
                )}
            </CardHeader>
            <CardContent>
                {isLoading ? (
                    <Skeleton className="h-3 w-32" />
                ) : (
                    <p className="text-xs text-[hsl(var(--foreground-muted))]">{helper}</p>
                )}
            </CardContent>
        </Card>
    )
}

export default function AnalyticsPage() {
    const navigate = useNavigate()
    const [range, setRange] = useState<DateRangeValue>(() => {
        const end = new Date()
        const start = new Date()
        start.setDate(end.getDate() - (APP_CONFIG.analytics.defaultRangeDays - 1))
        return { from: start.toISOString().slice(0, 10), to: end.toISOString().slice(0, 10) }
    })
    const [appliedRange, setAppliedRange] = useState<DateRangeValue>(range)
    const [forecastHoursAhead, setForecastHoursAhead] = useState(3)

    const trendsParams = useMemo(
        () => ({
            from: appliedRange.from,
            to: appliedRange.to,
            granularity: 'day' as const,
        }),
        [appliedRange],
    )

    const { data: summaryData, isLoading: summaryLoading } = useAnalyticsSummary(
        { from: appliedRange.from, to: appliedRange.to },
    )
    const { data: trendsData, isLoading: trendsLoading } = useAnalyticsTrends(trendsParams)
    const { data: districtVolumeData, isLoading: districtVolumeLoading } = useDistrictVolume(
        { from: appliedRange.from, to: appliedRange.to },
    )
    const { data: demandForecastData, isLoading: demandForecastLoading } = useDistrictDemandForecast(
        { hoursAhead: forecastHoursAhead },
    )

    const { data: driverAnalyticsData } = useDriverAnalytics()

    const driversAtRisk = useMemo(() => {
        if (!driverAnalyticsData) return []
        return driverAnalyticsData.drivers
            .filter((d) => d.anomalyRate > 0.15 || (d.onTimeRatePct !== null && d.onTimeRatePct < 60))
            .sort((a, b) => b.anomalyRate - a.anomalyRate)
            .slice(0, 5)
    }, [driverAnalyticsData])

    const { data: sarimaForecast } = useSarimaDeliveryForecast(3)

    const { data: statusBreakdownData, isLoading: statusBreakdownLoading } = useStatusBreakdown(
        { from: appliedRange.from, to: appliedRange.to },
    )

    const { data: allDistricts = [] } = useDistricts()
    const districtNameMap = useMemo(
        () => Object.fromEntries(allDistricts.map((d) => [d.id, d.name])),
        [allDistricts],
    )

    const summary = summaryData
    const isLoading = summaryLoading

    const deliveryTrend = useMemo(
        () => trendsData?.deliveryTrend.map((p) => ({ bucket: p.bucket, deliveries: p.value })) ?? [],
        [trendsData],
    )

    const anomalyTrend = useMemo(
        () => trendsData?.anomalyTrend.map((p) => ({ bucket: p.bucket, anomalies: p.value })) ?? [],
        [trendsData],
    )

    const urgencyTrend = useMemo(
        () => trendsData?.urgencyTrend.map((p) => ({ bucket: p.bucket, avgScore: p.value })) ?? [],
        [trendsData],
    )

    const top5DemandForecast = useMemo(
        () =>
            (demandForecastData?.items ?? [])
                .slice(0, 5)
                .map((item) => ({
                    district: item.districtName,
                    districtId: item.districtId,
                    predicted: Math.round(item.predictedDeliveries * 10) / 10,
                })),
        [demandForecastData],
    )

    const downloadCsv = async (mode: 'range' | 'full') => {
        const payload = { mode, from: range.from, to: range.to, days: ALL_DAYS, fromHour: FULL_HOUR_START, toHour: FULL_HOUR_END }
        const response = await apiClient.post(APP_CONFIG.api.exportCsvPath, payload, { responseType: 'blob' })
        const blob = new Blob([response.data as BlobPart], { type: 'text/csv' })
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = `${APP_CONFIG.export.csvFilenamePrefix}-${mode}-${range.from}-to-${range.to}.csv`
        document.body.appendChild(link)
        link.click()
        link.remove()
        URL.revokeObjectURL(url)
    }

    return (
        <div className="flex flex-col gap-6 p-6">
            <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div>
                    <h1 className="text-xl font-semibold tracking-tight text-[hsl(var(--foreground))]">Analytics</h1>
                    <p className="text-xs text-[hsl(var(--foreground-muted))]">Operational insights and trends.</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    <DateRangePicker value={range} onChange={setRange} onApply={setAppliedRange} />
                    <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" onClick={() => downloadCsv('range')}>
                            Download CSV
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => downloadCsv('full')}>
                            Download Full CSV
                        </Button>
                    </div>
                </div>
            </header>

            <div className="flex flex-col gap-6">
                    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                        <MetricCard
                            label="Total Deliveries"
                            value={(summary?.totalDeliveriesToday ?? 0).toLocaleString()}
                            helper="Created in selected range"
                            isLoading={isLoading}
                        />
                        <MetricCard
                            label="Completion Rate"
                            value={formatPercent(summary?.completionRate ?? 0)}
                            helper="Delivered vs created in range"
                            isLoading={isLoading}
                        />
                        <MetricCard
                            label="Active Drivers"
                            value={(summary?.activeDrivers ?? 0).toString()}
                            helper="Online right now"
                            isLoading={isLoading}
                        />
                        <MetricCard
                            label="Anomaly Rate"
                            value={formatPercent(summary?.anomalyRate ?? 0)}
                            helper="Flagged deliveries in range"
                            isLoading={isLoading}
                        />
                    </section>
                    <section className="grid gap-4 sm:grid-cols-3">
                        <MetricCard
                            label="Pending Deliveries"
                            value={(summary?.pendingDeliveries ?? 0).toString()}
                            helper="Unassigned right now"
                            isLoading={isLoading}
                        />
                        <MetricCard
                            label="Avg Delivery Time"
                            value={`${(summary?.avgDeliveryMinutes ?? 0).toFixed(1)} min`}
                            helper="Pickup → delivered in range"
                            isLoading={isLoading}
                        />
                        <MetricCard
                            label="On-Time Rate"
                            value={`${(summary?.onTimeRatePct ?? 0).toFixed(1)}%`}
                            helper="Delivered before ETA in range"
                            isLoading={isLoading}
                        />
                    </section>

                    <section className="grid gap-4 lg:grid-cols-2">
                        <Card>
                            <CardHeader>
                                <div className="flex items-start justify-between gap-2">
                                    <div>
                                        <CardTitle className="text-sm font-semibold uppercase tracking-widest text-[hsl(var(--foreground-muted))]">
                                            Delivery Trend
                                        </CardTitle>
                                        <CardDescription className="text-xs text-[hsl(var(--foreground-muted))]">
                                            Volume across the selected range.
                                        </CardDescription>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => navigate('/deliveries')}
                                        className="shrink-0 text-[11px] text-[hsl(var(--foreground-muted))] hover:text-[hsl(var(--primary))] transition-colors"
                                    >
                                        View all →
                                    </button>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <DeliveryTrendChart
                                    data={deliveryTrend}
                                    forecast={sarimaForecast}
                                    isLoading={trendsLoading}
                                />
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <div className="flex items-start justify-between gap-2">
                                    <div>
                                        <CardTitle className="text-sm font-semibold uppercase tracking-widest text-[hsl(var(--foreground-muted))]">
                                            Anomaly Rate
                                        </CardTitle>
                                        <CardDescription className="text-xs text-[hsl(var(--foreground-muted))]">
                                            Anomaly counts across the selected range.
                                        </CardDescription>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => navigate('/alerts')}
                                        className="shrink-0 text-[11px] text-[hsl(var(--foreground-muted))] hover:text-[hsl(var(--primary))] transition-colors"
                                    >
                                        View alerts →
                                    </button>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <AnomalyRateChart data={anomalyTrend} isLoading={trendsLoading} />
                            </CardContent>
                        </Card>
                    </section>

                    <section className="grid gap-4 lg:grid-cols-2">
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-sm font-semibold uppercase tracking-widest text-[hsl(var(--foreground-muted))]">
                                    District Volume
                                </CardTitle>
                                <CardDescription className="text-xs text-[hsl(var(--foreground-muted))]">
                                    Deliveries by district in range. Click a bar to drillthrough.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <DistrictVolumeChart
                                    data={
                                        districtVolumeData?.items.map((item) => ({
                                            district: districtNameMap[item.districtId] ?? item.districtId,
                                            districtId: item.districtId,
                                            deliveries: item.deliveries,
                                        })) ?? []
                                    }
                                    isLoading={districtVolumeLoading}
                                    onBarClick={(districtId) => navigate('/deliveries', { state: { districtId } })}
                                />
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="text-sm font-semibold uppercase tracking-widest text-[hsl(var(--foreground-muted))]">
                                    Status Breakdown
                                </CardTitle>
                                <CardDescription className="text-xs text-[hsl(var(--foreground-muted))]">
                                    Deliveries by status in range.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <StatusBreakdownChart
                                    data={statusBreakdownData?.items ?? []}
                                    isLoading={statusBreakdownLoading}
                                />
                            </CardContent>
                        </Card>
                    </section>

                    <section className="grid gap-4">
                        <Card>
                            <CardHeader>
                                <div className="flex items-start justify-between gap-2">
                                    <div>
                                        <CardTitle className="text-sm font-semibold uppercase tracking-widest text-[hsl(var(--foreground-muted))]">
                                            Top 5 Districts — Predicted Demand
                                        </CardTitle>
                                        <CardDescription className="text-xs text-[hsl(var(--foreground-muted))]">
                                            Seasonal-naive forecast (28-day same hour/day-of-week average), summed over the
                                            selected lookahead window.
                                        </CardDescription>
                                    </div>
                                    <div className="flex shrink-0 items-center gap-1.5 rounded-lg border border-[hsl(var(--primary)/0.4)] bg-[hsl(var(--primary)/0.1)] px-2.5 py-1.5">
                                        <span className="text-[10px] uppercase tracking-wide font-medium whitespace-nowrap text-[hsl(var(--primary))]">
                                            Next {forecastHoursAhead}h
                                        </span>
                                        <input
                                            type="range"
                                            min={1}
                                            max={12}
                                            step={1}
                                            value={forecastHoursAhead}
                                            onChange={(e) => setForecastHoursAhead(Number(e.target.value))}
                                            className="w-20 accent-[hsl(var(--primary))]"
                                            aria-label="Forecast lookahead hours"
                                        />
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <DistrictDemandForecastChart
                                    data={top5DemandForecast}
                                    isLoading={demandForecastLoading}
                                />
                            </CardContent>
                        </Card>
                    </section>

                    <section className="grid gap-4 lg:grid-cols-2">
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-sm font-semibold uppercase tracking-widest text-[hsl(var(--foreground-muted))]">
                                    Avg Urgency Score
                                </CardTitle>
                                <CardDescription className="text-xs text-[hsl(var(--foreground-muted))]">
                                    Mean AI urgency score (1–10) per day for anomalous deliveries.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <UrgencyTrendChart
                                    data={urgencyTrend}
                                    isLoading={trendsLoading}
                                />
                            </CardContent>
                        </Card>

                        {driversAtRisk.length > 0 && (
                            <Card>
                                <CardHeader>
                                    <div className="flex items-start justify-between gap-2">
                                        <div>
                                            <CardTitle className="text-sm font-semibold uppercase tracking-widest text-[hsl(var(--foreground-muted))]">
                                                Drivers at Risk
                                            </CardTitle>
                                            <CardDescription className="text-xs text-[hsl(var(--foreground-muted))]">
                                                High anomaly rate or &lt;60% on-time over the last 7 days.
                                            </CardDescription>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => navigate('/drivers')}
                                            className="shrink-0 text-[11px] text-[hsl(var(--foreground-muted))] hover:text-[hsl(var(--primary))] transition-colors"
                                        >
                                            View all →
                                        </button>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="flex flex-col divide-y divide-[hsl(var(--border))]">
                                        {driversAtRisk.map((d) => (
                                            <div key={d.driverId} className="flex items-center gap-3 py-2.5">
                                                <div className="flex-1 min-w-0">
                                                    <p className="truncate text-sm font-medium text-[hsl(var(--foreground))]">{d.name}</p>
                                                    <p className="text-[11px] text-[hsl(var(--foreground-muted))]">{districtNameMap[d.districtId] ?? d.districtId}</p>
                                                </div>
                                                <div className="flex items-center gap-3 text-xs tabular-nums shrink-0">
                                                    <span className={d.anomalyRate >= 0.15 ? 'text-red-400' : 'text-amber-400'}>
                                                        {(d.anomalyRate * 100).toFixed(0)}% anomaly
                                                    </span>
                                                    {d.onTimeRatePct !== null && (
                                                        <span className={d.onTimeRatePct < 60 ? 'text-red-400' : 'text-amber-400'}>
                                                            {d.onTimeRatePct.toFixed(0)}% on-time
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                    </section>
                </div>
        </div>
    )
}
