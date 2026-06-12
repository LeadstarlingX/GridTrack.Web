import type { ReactNode } from 'react'
import { useDriverStats } from '@/lib/api/queries/useDriverStats'
import { Loader2, TrendingUp, Package, PackageX, Activity } from 'lucide-react'

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

export default function DriverPerformanceCard({ driverId }: Props) {
    const { data, isLoading, isError } = useDriverStats(driverId)

    if (isLoading) {
        return (
            <div className="flex items-center gap-2 px-6 py-4 text-xs text-[hsl(var(--foreground-muted))]">
                <Loader2 size={12} className="animate-spin" />
                Loading stats…
            </div>
        )
    }

    if (isError || !data) {
        return (
            <p className="px-6 py-4 text-xs text-red-400">Failed to load driver stats.</p>
        )
    }

    const onTimeColor =
        data.onTimeRatePct >= 80 ? 'text-green-400' :
        data.onTimeRatePct >= 60 ? 'text-amber-400' :
        'text-red-400'

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
                        <span className={onTimeColor}>
                            {data.onTimeRatePct.toFixed(1)}%
                        </span>
                    }
                />
                <Stat
                    icon={Package}
                    label="Completed"
                    value={data.totalCompleted}
                    sub={`${data.completedToday} today`}
                />
                <Stat
                    icon={Activity}
                    label="Active now"
                    value={data.activeDeliveries}
                />
                <Stat
                    icon={PackageX}
                    label="Cancelled"
                    value={data.totalCancelled}
                />
            </div>
        </div>
    )
}
