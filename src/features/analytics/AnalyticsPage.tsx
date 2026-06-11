import { useMemo, useState } from 'react'
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Skeleton } from '@/components/ui'
import DeliveryTrendChart from '@/components/charts/DeliveryTrendChart'
import AnomalyRateChart from '@/components/charts/AnomalyRateChart'
import DistrictVolumeChart from '@/components/charts/DistrictVolumeChart'
import { APP_CONFIG } from '@/config/app.config'
import { MOCK_ANALYTICS, MOCK_ANALYTICS_TRENDS, MOCK_DISTRICT_VOLUME } from '@/constants/mockData'
import { useDistrictVolume } from '@/lib/api/queries/useDistrictVolume'
import { PAGE_CONFIG } from '@/config/pages.config'
import { apiClient } from '@/lib/api/client'
import { useAnalyticsSummary } from '@/lib/api/queries/useAnalyticsSummary'
import { useAnalyticsTrends } from '@/lib/api/queries/useAnalyticsTrends'
import DateRangePicker, { type DateRangeValue } from './DateRangePicker'
import ChatbotPanel from './chatbot/ChatbotPanel'

const USE_MOCK = import.meta.env.VITE_USE_MOCK_SIGNALR !== 'false'

type AnalyticsTab = 'overview' | 'ai'
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

function sliceMockTrends(days: number) {
    const total = MOCK_ANALYTICS_TRENDS.length
    const target = days <= 7 ? 8 : days <= 14 ? 10 : total
    return MOCK_ANALYTICS_TRENDS.slice(Math.max(0, total - target))
}

export default function AnalyticsPage() {
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

    const { data: summaryData, isLoading: summaryLoading } = useAnalyticsSummary()
    const { data: trendsData, isLoading: trendsLoading } = useAnalyticsTrends(trendsParams)
    const { data: districtVolumeData, isLoading: districtVolumeLoading } = useDistrictVolume(
        USE_MOCK ? undefined : { from: appliedRange.from, to: appliedRange.to },
    )

    // In mock mode, fall back to static mock data
    const summary = USE_MOCK ? MOCK_ANALYTICS : summaryData
    const isLoading = USE_MOCK ? false : summaryLoading

    const rangeDays = useMemo(() => getRangeDays(appliedRange.from, appliedRange.to), [appliedRange])

    const deliveryTrend = useMemo(() => {
        if (USE_MOCK) {
            return sliceMockTrends(rangeDays).map((item) => ({ bucket: item.bucket, deliveries: item.deliveries }))
        }
        return trendsData?.deliveryTrend.map((p) => ({ bucket: p.bucket, deliveries: p.value })) ?? []
    }, [USE_MOCK, rangeDays, trendsData])

    const anomalyTrend = useMemo(() => {
        if (USE_MOCK) {
            return sliceMockTrends(rangeDays).map((item) => ({ bucket: item.bucket, anomalies: item.anomalies }))
        }
        return trendsData?.anomalyTrend.map((p) => ({ bucket: p.bucket, anomalies: p.value })) ?? []
    }, [USE_MOCK, rangeDays, trendsData])

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
                    <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                        <MetricCard
                            label="Deliveries Today"
                            value={(summary?.totalDeliveriesToday ?? 0).toLocaleString()}
                            helper="Last 24 hours"
                            isLoading={isLoading}
                        />
                        <MetricCard
                            label="Completion Rate"
                            value={formatPercent(summary?.completionRate ?? 0)}
                            helper="Delivered vs created"
                            isLoading={isLoading}
                        />
                        <MetricCard
                            label="Active Drivers"
                            value={(summary?.activeDrivers ?? 0).toString()}
                            helper="Currently in transit"
                            isLoading={isLoading}
                        />
                        <MetricCard
                            label="Anomaly Rate"
                            value={formatPercent(summary?.anomalyRate ?? 0)}
                            helper="Last 7 days"
                            isLoading={isLoading}
                        />
                    </section>

                    <section className="grid gap-4 lg:grid-cols-2">
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-sm font-semibold uppercase tracking-widest text-[hsl(var(--foreground-muted))]">
                                    Delivery Trend
                                </CardTitle>
                                <CardDescription className="text-xs text-[hsl(var(--foreground-muted))]">
                                    Volume across the selected range.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <DeliveryTrendChart data={deliveryTrend} isLoading={USE_MOCK ? false : trendsLoading} />
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="text-sm font-semibold uppercase tracking-widest text-[hsl(var(--foreground-muted))]">
                                    Anomaly Rate
                                </CardTitle>
                                <CardDescription className="text-xs text-[hsl(var(--foreground-muted))]">
                                    Anomaly counts across the selected range.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <AnomalyRateChart data={anomalyTrend} isLoading={USE_MOCK ? false : trendsLoading} />
                            </CardContent>
                        </Card>
                    </section>

                    <section className="grid gap-4">
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-sm font-semibold uppercase tracking-widest text-[hsl(var(--foreground-muted))]">
                                    District Volume
                                </CardTitle>
                                <CardDescription className="text-xs text-[hsl(var(--foreground-muted))]">
                                    Deliveries by district.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <DistrictVolumeChart
                                    data={
                                        USE_MOCK
                                            ? MOCK_DISTRICT_VOLUME
                                            : (districtVolumeData?.items.map((item) => ({
                                                  district: item.districtId,
                                                  deliveries: item.deliveries,
                                              })) ?? [])
                                    }
                                    isLoading={!USE_MOCK && districtVolumeLoading}
                                />
                            </CardContent>
                        </Card>
                    </section>
                </div>
            ) : (
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
            )}
        </div>
    )
}
