import { useLiveStore } from '@/store/liveStore'
import { cn } from '@/lib/utils'

function formatEta(seconds: number): string {
    if (seconds < 60) return `${seconds}s`
    const m = Math.round(seconds / 60)
    return m >= 60 ? `${Math.floor(m / 60)}h ${m % 60}m` : `${m}m`
}

export default function LiveKpiStrip() {
    const drivers = useLiveStore((s) => s.drivers)
    const deliveries = useLiveStore((s) => s.deliveries)
    const alerts = useLiveStore((s) => s.anomalyQueue)

    const activeDrivers = Object.values(drivers).filter((d) => d.status !== 'offline').length
    const inTransit = Object.values(deliveries).filter((d) => d.status === 'InTransit')
    const avgEta = inTransit.length > 0
        ? Math.round(inTransit.reduce((sum, d) => sum + (d.etaSeconds ?? 0), 0) / inTransit.length)
        : null
    const unresolvedAlerts = alerts.length

    const chips: { label: string; value: string | number; accent?: string }[] = [
        { label: 'Active drivers',       value: activeDrivers,             accent: 'text-[hsl(var(--foreground))]' },
        { label: 'In-transit',           value: inTransit.length,          accent: 'text-[hsl(var(--foreground))]' },
        { label: 'Avg ETA',              value: avgEta != null ? formatEta(avgEta) : '—' },
        { label: 'Unresolved alerts',    value: unresolvedAlerts,          accent: unresolvedAlerts > 0 ? 'text-amber-500' : undefined },
    ]

    return (
        <div className="flex items-center gap-2 px-3 py-1.5 bg-[hsl(var(--surface))] border-b border-[hsl(var(--border))] flex-wrap">
            {chips.map(({ label, value, accent }) => (
                <div key={label} className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[hsl(var(--surface-raised))] border border-[hsl(var(--border))]">
                    <span className="text-[10px] text-[hsl(var(--foreground-muted))] uppercase tracking-wide font-medium">{label}</span>
                    <span className={cn('text-xs font-semibold tabular-nums', accent ?? 'text-[hsl(var(--foreground))]')}>{value}</span>
                </div>
            ))}
        </div>
    )
}
