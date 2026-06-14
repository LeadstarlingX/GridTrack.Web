import type { ReactNode } from 'react'
import { useDriverStats } from '@/lib/api/queries/useDriverStats'
import { useDriverAnalytics } from '@/lib/api/queries/useDriverAnalytics'
import { Loader2, TrendingUp, Package, AlertTriangle, Activity } from 'lucide-react'
import { AreaChart, Area, Tooltip, ResponsiveContainer } from 'recharts'

interface Props {
    driverId: string
}

function Stat({ icon: Icon, label, value, sub }: {
    icon: React.ElementType
    label: string
    value: ReactNode
    sub?: string
}) {
    return (
        <div className="flex items-start gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[hsl(var(--border))]">
                <Icon size={14} className="text-[hsl(var(--foreground-muted))]" />
            </div>
            <div>
                <p className="text-xs text-[hsl(var(--foreground-muted))]">{label}</p>
                <p className="text-sm font-semibold tabular-nums text-[hsl(var(--foreground))]">{value}</p>
                {sub && <p className="text-[11px] text-[hsl(var(--foreground-subtle,var(--foreground-muted)))]">{sub}</p>}
            </div>
        </div>
    )
}

function onTimeColor(pct: number) {
    return pct >= 80 ? 'text-green-400' : pct >= 60 ? 'text-amber-400' : 'text-red-400'
}

function anomalyColor(rate: number) {
    return rate < 0.05 ? 'text-green-400' : rate < 0.15 ? 'text-amber-400' : 'text-red-400'
}

export default function DriverPerformanceCard({ driverId }: Props) {
    const { data: stats, isLoading, isError } = useDriverStats(driverId)
    const { data: analytics } = useDriverAnalytics()
    const driverAnalytics = analytics?.drivers.find((d) => d.driverId === driverId)

    if (isLoading) {
        return (
            <div className="flex items-center gap-2 px-6 py-4 text-xs text-[hsl(var(--foreground-muted))]">
                <Loader2 size={12} className="animate-spin" />
                Loading stats…
            </div>
        )
    }

    if (isError || !stats) {
        return (
            <p className="px-6 py-4 text-xs text-red-400">Failed to load driver stats.</p>
        )
    }

    const avgMinutes = driverAnalytics ? (driverAnalytics.avgDurationSeconds / 60).toFixed(0) : null
    const districtAvgMinutes = driverAnalytics ? (driverAnalytics.districtAvgDurationSeconds / 60).toFixed(0) : null
    const durationDiffMin = driverAnalytics
        ? ((driverAnalytics.avgDurationSeconds - driverAnalytics.districtAvgDurationSeconds) / 60)
        : null
    const fasterThanDistrict = durationDiffMin !== null ? durationDiffMin < 0 : null

    const sparklineData = (driverAnalytics?.onTimeByHour ?? [])
        .filter((p) => p.sampleCount > 0 && p.hour >= 6 && p.hour <= 22)
        .map((p) => ({ h: `${p.hour}h`, v: Math.round(p.onTimeRatePct) }))

    return (
        <div className="border-t border-[hsl(var(--border))] bg-[hsl(var(--surface))] px-6 py-4">
            <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-[hsl(var(--foreground-muted))]">
                Performance
            </p>

            <div className="grid grid-cols-2 gap-x-8 gap-y-4 sm:grid-cols-4">
                <Stat
                    icon={TrendingUp}
                    label="On-time rate"
                    value={
                        <span className={onTimeColor(stats.onTimeRatePct)}>
                            {stats.onTimeRatePct.toFixed(1)}%
                        </span>
                    }
                    sub={
                        driverAnalytics?.onTimeRatePct != null
                            ? `${driverAnalytics.onTimeRatePct.toFixed(0)}% (7-day avg)`
                            : undefined
                    }
                />
                <Stat
                    icon={Package}
                    label="Completed"
                    value={stats.totalCompleted}
                    sub={
                        driverAnalytics
                            ? `${stats.completedToday} today · ${driverAnalytics.completedLast7Days} last 7d`
                            : `${stats.completedToday} today`
                    }
                />
                <Stat
                    icon={Activity}
                    label="Active now"
                    value={stats.activeDeliveries}
                />
                {driverAnalytics ? (
                    <Stat
                        icon={AlertTriangle}
                        label="Anomaly rate"
                        value={
                            <span className={anomalyColor(driverAnalytics.anomalyRate)}>
                                {(driverAnalytics.anomalyRate * 100).toFixed(1)}%
                            </span>
                        }
                        sub="7-day"
                    />
                ) : (
                    <Stat
                        icon={AlertTriangle}
                        label="Cancelled"
                        value={stats.totalCancelled}
                    />
                )}
            </div>

            {driverAnalytics && (
                <div className="mt-4 flex flex-wrap items-center gap-4">
                    <div className="flex flex-col gap-0.5">
                        <p className="text-[10px] text-[hsl(var(--foreground-muted))] uppercase tracking-wider">Avg delivery time</p>
                        <div className="flex items-baseline gap-1.5">
                            <span className="text-sm font-semibold tabular-nums">{avgMinutes} min</span>
                            {durationDiffMin !== null && (
                                <span className={`text-[11px] font-medium ${fasterThanDistrict ? 'text-green-400' : 'text-amber-400'}`}>
                                    {fasterThanDistrict ? '▼' : '▲'}{Math.abs(durationDiffMin).toFixed(1)}m vs district ({districtAvgMinutes}m)
                                </span>
                            )}
                        </div>
                    </div>

                    {sparklineData.length >= 4 && (
                        <div className="ml-auto flex flex-col items-end gap-0.5">
                            <p className="text-[10px] text-[hsl(var(--foreground-muted))] uppercase tracking-wider">On-time by hour (6–22)</p>
                            <div className="h-9 w-36">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={sparklineData} margin={{ top: 2, bottom: 0, left: 0, right: 0 }}>
                                        <Area
                                            type="monotone"
                                            dataKey="v"
                                            stroke="hsl(var(--primary))"
                                            fill="hsl(var(--primary) / 0.15)"
                                            strokeWidth={1.5}
                                            dot={false}
                                        />
                                        <Tooltip
                                            contentStyle={{
                                                background: 'hsl(var(--surface))',
                                                border: '1px solid hsl(var(--border))',
                                                borderRadius: 4,
                                                fontSize: 10,
                                                padding: '2px 6px',
                                            }}
                                            formatter={(v) => [v != null ? `${v}%` : '', 'On-time']}
                                            labelFormatter={(l) => l}
                                        />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}
