import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Skeleton } from '@/components/ui'
import DeliveryTrendChart from '@/components/charts/DeliveryTrendChart'
import AnomalyRateChart from '@/components/charts/AnomalyRateChart'
import DistrictVolumeChart from '@/components/charts/DistrictVolumeChart'
import StatusBreakdownChart from '@/components/charts/StatusBreakdownChart'
import UrgencyTrendChart from '@/components/charts/UrgencyTrendChart'
import { APP_CONFIG } from '@/config/app.config'
import { useDistricts } from '@/lib/api/queries/useDistricts'
import { useDistrictVolume } from '@/lib/api/queries/useDistrictVolume'
import { useDriverAnalytics } from '@/lib/api/queries/useDriverAnalytics'
import { useAnomalyBreakdown } from '@/lib/api/queries/useAnomalyBreakdown'
import { useCancellationAnalytics } from '@/lib/api/queries/useCancellationAnalytics'
import { useDeliveryPerformance } from '@/lib/api/queries/useDeliveryPerformance'
import { useDriverUtilization } from '@/lib/api/queries/useDriverUtilization'
import { PAGE_CONFIG } from '@/config/pages.config'
import { apiClient } from '@/lib/api/client'
import { useAnalyticsSummary } from '@/lib/api/queries/useAnalyticsSummary'
import { useAnalyticsTrends } from '@/lib/api/queries/useAnalyticsTrends'
import { useStatusBreakdown } from '@/lib/api/queries/useStatusBreakdown'
import DateRangePicker, { type DateRangeValue } from './DateRangePicker'
import ChatbotPanel from './chatbot/ChatbotPanel'
import StaffingWidget from './staffing/StaffingWidget'

type AnalyticsTab = 'overview' | 'performance' | 'ai'
type DayKey = 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun'

const DAY_OPTIONS: { key: DayKey; label: string }[] = [
    { key: 'mon', label: 'Mon' },
    { key: 'tue', label: 'Tue' },
    { key: 'wed', label: 'Wed' },
    { key: 'thu', label: 'Thu' },
    { key: 'fri', label: 'Fri' },
    { key: 'sat', label: 'Sat' },
    { key: 'sun', label: 'Sun' },
]

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

function getRangeDays(from: string, to: string) {
    const diff = Math.max(0, new Date(to).getTime() - new Date(from).getTime())
    return Math.floor(diff / (1000 * 60 * 60 * 24)) + 1
}

export default function AnalyticsPage() {
    const navigate = useNavigate()
    const chatbotEnabled = PAGE_CONFIG.analyticsChatbot.enabled
    const [activeTab, setActiveTab] = useState<AnalyticsTab>('overview')
    const [activeDays, setActiveDays] = useState<DayKey[]>(DAY_OPTIONS.map((d) => d.key))
    const [hourStart, setHourStart] = useState<number>(APP_CONFIG.analytics.defaultHourStart)
    const [hourEnd, setHourEnd] = useState<number>(APP_CONFIG.analytics.defaultHourEnd)
    const [range, setRange] = useState<DateRangeValue>(() => {
        const end = new Date()
        const start = new Date()
        start.setDate(end.getDate() - (APP_CONFIG.analytics.defaultRangeDays - 1))
        return { from: start.toISOString().slice(0, 10), to: end.toISOString().slice(0, 10) }
    })
    const [appliedRange, setAppliedRange] = useState<DateRangeValue>(range)

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

    const { data: driverAnalyticsData } = useDriverAnalytics()

    const driversAtRisk = useMemo(() => {
        if (!driverAnalyticsData) return []
        return driverAnalyticsData.drivers
            .filter((d) => d.anomalyRate > 0.15 || (d.onTimeRatePct !== null && d.onTimeRatePct < 60))
            .sort((a, b) => b.anomalyRate - a.anomalyRate)
            .slice(0, 5)
    }, [driverAnalyticsData])

    const { data: statusBreakdownData, isLoading: statusBreakdownLoading } = useStatusBreakdown(
        { from: appliedRange.from, to: appliedRange.to },
    )
    const { data: anomalyBreakdownData, isLoading: anomalyBreakdownLoading } = useAnomalyBreakdown(
        appliedRange.from,
        appliedRange.to,
    )
    const { data: cancellationData, isLoading: cancellationLoading } = useCancellationAnalytics(
        appliedRange.from,
        appliedRange.to,
    )
    const { data: deliveryPerformanceData, isLoading: deliveryPerformanceLoading } = useDeliveryPerformance(
        appliedRange.from,
        appliedRange.to,
    )
    const { data: driverUtilizationData, isLoading: driverUtilizationLoading } = useDriverUtilization()

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

    const downloadCsv = async (mode: 'range' | 'full') => {
        const payload = { mode, from: range.from, to: range.to, days: activeDays, fromHour: hourStart, toHour: hourEnd }
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

    const toggleDay = (day: DayKey) => {
        setActiveDays((prev) => (prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]))
    }

    const handleHourStart = (value: string) => {
        const next = Math.max(0, Math.min(23, Number(value)))
        setHourStart(next)
        if (next > hourEnd) setHourEnd(next)
    }

    const handleHourEnd = (value: string) => {
        const next = Math.max(0, Math.min(23, Number(value)))
        setHourEnd(next)
        if (next < hourStart) setHourStart(next)
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
                    <div className="flex flex-wrap items-center gap-2 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--surface))] px-3 py-2">
                        <span className="text-xs text-[hsl(var(--foreground-muted))]">Days</span>
                        <div className="flex flex-wrap items-center gap-1">
                            {DAY_OPTIONS.map((day) => (
                                <Button
                                    key={day.key}
                                    variant={activeDays.includes(day.key) ? 'secondary' : 'ghost'}
                                    size="xs"
                                    onClick={() => toggleDay(day.key)}
                                >
                                    {day.label}
                                </Button>
                            ))}
                        </div>
                        <span className="text-xs text-[hsl(var(--foreground-muted))]">Hours</span>
                        <input
                            type="number"
                            min={APP_CONFIG.analytics.minHour}
                            max={APP_CONFIG.analytics.maxHour}
                            value={hourStart}
                            onChange={(e) => handleHourStart(e.target.value)}
                            className="h-7 w-14 rounded-md border border-[hsl(var(--border))] bg-[hsl(var(--surface))] px-2 text-xs text-[hsl(var(--foreground))]"
                        />
                        <span className="text-xs text-[hsl(var(--foreground-muted))]">to</span>
                        <input
                            type="number"
                            min={APP_CONFIG.analytics.minHour}
                            max={APP_CONFIG.analytics.maxHour}
                            value={hourEnd}
                            onChange={(e) => handleHourEnd(e.target.value)}
                            className="h-7 w-14 rounded-md border border-[hsl(var(--border))] bg-[hsl(var(--surface))] px-2 text-xs text-[hsl(var(--foreground))]"
                        />
                    </div>
                    <div className="flex items-center gap-2 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--surface))] px-2 py-1">
                        <Button
                            variant={activeTab === 'overview' ? 'secondary' : 'ghost'}
                            size="sm"
                            onClick={() => setActiveTab('overview')}
                        >
                            Overview
                        </Button>
                        <Button
                            variant={activeTab === 'performance' ? 'secondary' : 'ghost'}
                            size="sm"
                            onClick={() => setActiveTab('performance')}
                        >
                            Performance
                        </Button>
                        <Button
                            variant={activeTab === 'ai' ? 'secondary' : 'ghost'}
                            size="sm"
                            onClick={() => setActiveTab('ai')}
                        >
                            AI Analysis
                        </Button>
                    </div>
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

            {activeTab === 'overview' ? (
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
                                <DeliveryTrendChart data={deliveryTrend} isLoading={trendsLoading} />
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
            ) : activeTab === 'performance' ? (
                <div className="flex flex-col gap-6">
                    <section className="grid gap-4 lg:grid-cols-2">
                        {/* Delivery Performance */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-sm font-semibold uppercase tracking-widest text-[hsl(var(--foreground-muted))]">
                                    Delivery Performance
                                </CardTitle>
                                <CardDescription className="text-xs text-[hsl(var(--foreground-muted))]">
                                    On-time rate and duration by district.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                {deliveryPerformanceLoading ? (
                                    <Skeleton className="h-40 w-full" />
                                ) : deliveryPerformanceData ? (
                                    <div className="flex flex-col gap-3">
                                        <div className="flex items-baseline gap-2">
                                            <span className="text-2xl font-semibold text-[hsl(var(--foreground))]">
                                                {(deliveryPerformanceData.overallOnTimeRate * 100).toFixed(1)}%
                                            </span>
                                            <span className="text-xs text-[hsl(var(--foreground-muted))]">overall on-time · {deliveryPerformanceData.deliveredCount.toLocaleString()} delivered</span>
                                        </div>
                                        <div className="flex flex-col gap-1.5 mt-1">
                                            {deliveryPerformanceData.districts.slice(0, 6).map((d) => (
                                                <div key={d.districtId} className="flex items-center gap-2">
                                                    <span className="w-24 shrink-0 truncate text-[11px] text-[hsl(var(--foreground-muted))]">
                                                        {districtNameMap[d.districtId] ?? d.districtId}
                                                    </span>
                                                    <div className="flex-1 h-1.5 rounded-full bg-[hsl(var(--surface-raised))] overflow-hidden">
                                                        <div
                                                            className="h-full rounded-full"
                                                            style={{
                                                                width: `${(d.onTimeRate * 100).toFixed(0)}%`,
                                                                background: d.onTimeRate >= 0.8
                                                                    ? 'hsl(var(--primary))'
                                                                    : d.onTimeRate >= 0.6
                                                                      ? '#fbbf24'
                                                                      : '#f87171',
                                                            }}
                                                        />
                                                    </div>
                                                    <span className="w-10 shrink-0 text-right text-[11px] tabular-nums text-[hsl(var(--foreground-muted))]">
                                                        {(d.onTimeRate * 100).toFixed(0)}%
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ) : (
                                    <p className="text-xs text-[hsl(var(--foreground-muted))]">No data for selected range.</p>
                                )}
                            </CardContent>
                        </Card>

                        {/* Anomaly Breakdown */}
                        <Card>
                            <CardHeader>
                                <div className="flex items-start justify-between gap-2">
                                    <div>
                                        <CardTitle className="text-sm font-semibold uppercase tracking-widest text-[hsl(var(--foreground-muted))]">
                                            Anomaly Breakdown
                                        </CardTitle>
                                        <CardDescription className="text-xs text-[hsl(var(--foreground-muted))]">
                                            Flagged deliveries by type and district.
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
                                {anomalyBreakdownLoading ? (
                                    <Skeleton className="h-40 w-full" />
                                ) : anomalyBreakdownData ? (
                                    <div className="flex flex-col gap-4">
                                        <div className="flex flex-wrap gap-2">
                                            {anomalyBreakdownData.byType.map((t) => (
                                                <div
                                                    key={t.anomalyType}
                                                    className="flex items-center gap-1.5 rounded-md border border-[hsl(var(--border))] bg-[hsl(var(--surface-raised))] px-2.5 py-1"
                                                >
                                                    <span className="text-xs font-medium text-[hsl(var(--foreground))]">{t.count}</span>
                                                    <span className="text-[11px] text-[hsl(var(--foreground-muted))]">{t.anomalyType}</span>
                                                </div>
                                            ))}
                                        </div>
                                        <div className="flex flex-col gap-1.5">
                                            {anomalyBreakdownData.byDistrict.slice(0, 5).map((d) => (
                                                <div key={d.districtId} className="flex items-center gap-2">
                                                    <span className="w-24 shrink-0 truncate text-[11px] text-[hsl(var(--foreground-muted))]">
                                                        {districtNameMap[d.districtId] ?? d.districtId}
                                                    </span>
                                                    <div className="flex-1 h-1.5 rounded-full bg-[hsl(var(--surface-raised))] overflow-hidden">
                                                        <div
                                                            className="h-full rounded-full bg-red-500"
                                                            style={{
                                                                width: `${Math.min(100, (d.count / (anomalyBreakdownData.byDistrict[0]?.count || 1)) * 100).toFixed(0)}%`,
                                                            }}
                                                        />
                                                    </div>
                                                    <span className="w-6 shrink-0 text-right text-[11px] tabular-nums text-[hsl(var(--foreground-muted))]">{d.count}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ) : (
                                    <p className="text-xs text-[hsl(var(--foreground-muted))]">No anomalies in selected range.</p>
                                )}
                            </CardContent>
                        </Card>
                    </section>

                    <section className="grid gap-4 lg:grid-cols-2">
                        {/* Cancellations */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-sm font-semibold uppercase tracking-widest text-[hsl(var(--foreground-muted))]">
                                    Cancellations
                                </CardTitle>
                                <CardDescription className="text-xs text-[hsl(var(--foreground-muted))]">
                                    Cancellation rate and top reasons in range.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                {cancellationLoading ? (
                                    <Skeleton className="h-40 w-full" />
                                ) : cancellationData ? (
                                    <div className="flex flex-col gap-3">
                                        <div className="flex items-baseline gap-4">
                                            <div>
                                                <span className="text-2xl font-semibold text-[hsl(var(--foreground))]">
                                                    {(cancellationData.cancellationRate * 100).toFixed(1)}%
                                                </span>
                                                <span className="ml-1 text-xs text-[hsl(var(--foreground-muted))]">rate</span>
                                            </div>
                                            <div className="text-xs text-[hsl(var(--foreground-muted))]">
                                                {cancellationData.totalCancelled} total · {cancellationData.lateCancellations} late
                                            </div>
                                        </div>
                                        {cancellationData.reasons.length > 0 && (
                                            <div className="flex flex-col gap-1 mt-1">
                                                <p className="text-[11px] font-medium text-[hsl(var(--foreground-muted))] uppercase tracking-wide">Top reasons</p>
                                                {cancellationData.reasons.slice(0, 5).map((r) => (
                                                    <div key={r.reason} className="flex items-center justify-between gap-2 py-0.5">
                                                        <span className="truncate text-xs text-[hsl(var(--foreground))]">{r.reason}</span>
                                                        <span className="shrink-0 text-xs tabular-nums text-[hsl(var(--foreground-muted))]">{r.count}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <p className="text-xs text-[hsl(var(--foreground-muted))]">No cancellations in selected range.</p>
                                )}
                            </CardContent>
                        </Card>

                        {/* Driver Utilization */}
                        <Card>
                            <CardHeader>
                                <div className="flex items-start justify-between gap-2">
                                    <div>
                                        <CardTitle className="text-sm font-semibold uppercase tracking-widest text-[hsl(var(--foreground-muted))]">
                                            Driver Utilization
                                        </CardTitle>
                                        <CardDescription className="text-xs text-[hsl(var(--foreground-muted))]">
                                            Top drivers by completions today.
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
                                {driverUtilizationLoading ? (
                                    <Skeleton className="h-40 w-full" />
                                ) : driverUtilizationData ? (
                                    <div className="flex flex-col gap-3">
                                        <div className="flex items-baseline gap-4 text-xs text-[hsl(var(--foreground-muted))]">
                                            <span><span className="text-lg font-semibold text-[hsl(var(--foreground))]">{driverUtilizationData.activeDrivers}</span> active</span>
                                            <span><span className="text-lg font-semibold text-[hsl(var(--foreground))]">{driverUtilizationData.inactiveDrivers}</span> inactive</span>
                                            <span>{driverUtilizationData.avgActiveDeliveriesPerActiveDriver.toFixed(1)} avg active loads</span>
                                        </div>
                                        <div className="flex flex-col divide-y divide-[hsl(var(--border))]">
                                            {driverUtilizationData.topDrivers.slice(0, 6).map((d) => (
                                                <div key={d.driverId} className="flex items-center gap-3 py-2">
                                                    <span className="flex-1 truncate text-xs font-medium text-[hsl(var(--foreground))]">{d.name}</span>
                                                    <span className="shrink-0 text-[11px] tabular-nums text-[hsl(var(--foreground-muted))]">
                                                        {d.completedToday} done · {d.activeDeliveries} active
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ) : (
                                    <p className="text-xs text-[hsl(var(--foreground-muted))]">No utilization data available.</p>
                                )}
                            </CardContent>
                        </Card>
                    </section>
                </div>
            ) : (
                <div className="flex flex-col gap-6">
                    <StaffingWidget />
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm font-semibold uppercase tracking-widest text-[hsl(var(--foreground-muted))]">
                                AI Analysis
                            </CardTitle>
                            <CardDescription className="text-xs text-[hsl(var(--foreground-muted))]">
                                Load a date range to start a conversation about the export.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {chatbotEnabled ? (
                                <ChatbotPanel
                                    range={range}
                                    activeDays={activeDays}
                                    hourStart={hourStart}
                                    hourEnd={hourEnd}
                                />
                            ) : (
                                <div className="rounded-lg border border-dashed border-[hsl(var(--border-strong))] bg-[hsl(var(--surface))] p-6">
                                    <p className="text-xs text-[hsl(var(--foreground-subtle))] italic">
                                        {PAGE_CONFIG.analyticsChatbot.disabledMessage}
                                    </p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    )
}
