import { useEffect, useMemo, useRef, useState } from 'react'
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Skeleton } from '@/components/ui'
import DeliveryTrendChart from '@/components/charts/DeliveryTrendChart'
import AnomalyRateChart from '@/components/charts/AnomalyRateChart'
import DistrictVolumeChart from '@/components/charts/DistrictVolumeChart'
import { MOCK_ANALYTICS, MOCK_ANALYTICS_TRENDS, MOCK_DISTRICT_VOLUME } from '@/constants/mockData'
import { PAGE_CONFIG } from '@/config/pages.config'
import DateRangePicker, { type DateRangeValue } from './DateRangePicker'
import ChatbotPanel from './chatbot/ChatbotPanel'

type AnalyticsTab = 'overview' | 'ai'

function formatPercent(value: number) {
    return `${Math.round(value * 100)}%`
}

function MetricCard({ label, value, helper, isLoading }: { label: string; value: string; helper: string; isLoading: boolean }) {
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
    const start = new Date(from)
    const end = new Date(to)
    const diff = Math.max(0, end.getTime() - start.getTime())
    return Math.floor(diff / (1000 * 60 * 60 * 24)) + 1
}

function sliceTrendsByRange(days: number) {
    const total = MOCK_ANALYTICS_TRENDS.length
    const target = days <= 7 ? 8 : days <= 14 ? 10 : total
    return MOCK_ANALYTICS_TRENDS.slice(Math.max(0, total - target))
}

    function buildApiUrl(path: string) {
        const baseUrl = import.meta.env.VITE_API_BASE_URL ?? ''
        return `${baseUrl}${path}`
    }

export default function AnalyticsPage() {
    const chatbotEnabled = PAGE_CONFIG.analyticsChatbot.enabled
    const [activeTab, setActiveTab] = useState<AnalyticsTab>('overview')
    const [isLoading, setIsLoading] = useState(false)
    const loadingRef = useRef<number | null>(null)
    const [range, setRange] = useState<DateRangeValue>(() => {
        const end = new Date()
        const start = new Date()
        start.setDate(end.getDate() - 6)
        return { from: start.toISOString().slice(0, 10), to: end.toISOString().slice(0, 10) }
    })
    const [appliedRange, setAppliedRange] = useState<DateRangeValue>(range)

    useEffect(() => {
        return () => {
            if (loadingRef.current) {
                window.clearTimeout(loadingRef.current)
            }
        }
    }, [])

    const handleApplyRange = (next: DateRangeValue) => {
        setIsLoading(true)
        setAppliedRange(next)
        if (loadingRef.current) {
            window.clearTimeout(loadingRef.current)
        }
        loadingRef.current = window.setTimeout(() => {
            setIsLoading(false)
        }, 500)
    }

    const rangeDays = useMemo(() => getRangeDays(appliedRange.from, appliedRange.to), [appliedRange.from, appliedRange.to])
    const slicedTrends = useMemo(() => sliceTrendsByRange(rangeDays), [rangeDays])

    const deliveryTrend = useMemo(
        () => slicedTrends.map((item) => ({ bucket: item.bucket, deliveries: item.deliveries })),
        [slicedTrends]
    )
    const anomalyTrend = useMemo(
        () => slicedTrends.map((item) => ({ bucket: item.bucket, anomalies: item.anomalies })),
        [slicedTrends]
    )

        const downloadCsv = (mode: 'range' | 'full') => {
            const query = mode === 'range' ? `?from=${range.from}&to=${range.to}` : ''
            const url = buildApiUrl(`/api/export/csv${query}`)
            window.open(url, '_blank')
        }

    return (
        <div className="flex flex-col gap-6 p-6">
            <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div>
                    <h1 className="text-xl font-semibold tracking-tight text-[hsl(var(--foreground))]">Analytics</h1>
                    <p className="text-xs text-[hsl(var(--foreground-muted))]">Operational insights and trends.</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    <DateRangePicker value={range} onChange={setRange} onApply={handleApplyRange} />
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
                            value={MOCK_ANALYTICS.totalDeliveriesToday.toLocaleString()}
                            helper="Last 24 hours"
                            isLoading={isLoading}
                        />
                        <MetricCard
                            label="Completion Rate"
                            value={formatPercent(MOCK_ANALYTICS.completionRate)}
                            helper="Delivered vs created"
                            isLoading={isLoading}
                        />
                        <MetricCard
                            label="Active Drivers"
                            value={MOCK_ANALYTICS.activeDrivers.toString()}
                            helper="Currently in transit"
                            isLoading={isLoading}
                        />
                        <MetricCard
                            label="Anomaly Rate"
                            value={formatPercent(MOCK_ANALYTICS.anomalyRate)}
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
                                    Hourly volume across the selected range.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <DeliveryTrendChart data={deliveryTrend} isLoading={isLoading} />
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="text-sm font-semibold uppercase tracking-widest text-[hsl(var(--foreground-muted))]">
                                    Anomaly Rate
                                </CardTitle>
                                <CardDescription className="text-xs text-[hsl(var(--foreground-muted))]">
                                    Hourly anomaly counts.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <AnomalyRateChart data={anomalyTrend} isLoading={isLoading} />
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
                                <DistrictVolumeChart data={MOCK_DISTRICT_VOLUME} isLoading={isLoading} />
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
                            <ChatbotPanel range={range} />
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