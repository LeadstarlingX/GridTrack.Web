import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, Skeleton } from '@/components/ui'
import { APP_CONFIG } from '@/config/app.config'
import { useDistricts } from '@/lib/api/queries/useDistricts'
import { useAnomalyBreakdown } from '@/lib/api/queries/useAnomalyBreakdown'
import { useCancellationAnalytics } from '@/lib/api/queries/useCancellationAnalytics'
import { useDeliveryPerformance } from '@/lib/api/queries/useDeliveryPerformance'
import { useDriverUtilization } from '@/lib/api/queries/useDriverUtilization'
import DateRangePicker, { type DateRangeValue } from './DateRangePicker'

export default function PerformancePage() {
    const navigate = useNavigate()
    const [range, setRange] = useState<DateRangeValue>(() => {
        const end = new Date()
        const start = new Date()
        start.setDate(end.getDate() - (APP_CONFIG.analytics.defaultRangeDays - 1))
        return { from: start.toISOString().slice(0, 10), to: end.toISOString().slice(0, 10) }
    })
    const [appliedRange, setAppliedRange] = useState<DateRangeValue>(range)

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

    return (
        <div className="flex flex-col gap-6 p-6">
            <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div>
                    <h1 className="text-xl font-semibold tracking-tight text-[hsl(var(--foreground))]">Performance</h1>
                    <p className="text-xs text-[hsl(var(--foreground-muted))]">Delivery performance, anomalies, cancellations and utilization.</p>
                </div>
                <DateRangePicker value={range} onChange={setRange} onApply={setAppliedRange} />
            </header>

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
    )
}
