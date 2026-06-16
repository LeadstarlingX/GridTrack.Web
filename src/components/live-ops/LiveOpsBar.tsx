import { useMemo, type ComponentType } from 'react'
import { Search, Thermometer } from 'lucide-react'
import { useMapStore } from '@/store/mapStore'
import { useLiveStore } from '@/store/liveStore'
import { cn } from '@/lib/utils'

function formatEta(s: number | null): string {
    if (s == null) return '—'
    const m = Math.floor(s / 60)
    return m >= 60 ? `${Math.floor(m / 60)}h ${m % 60}m` : m > 0 ? `${m}m` : `${s}s`
}

function KpiChip({ label, value, accent }: { label: string; value: string | number; accent?: string }) {
    return (
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[hsl(var(--surface-raised))] border border-[hsl(var(--border))]">
            <span className="text-[10px] text-[hsl(var(--foreground-muted))] uppercase tracking-wide font-medium whitespace-nowrap">
                {label}
            </span>
            <span className={cn('text-xs font-semibold tabular-nums', accent ?? 'text-[hsl(var(--foreground))]')}>
                {value}
            </span>
        </div>
    )
}

interface GlowBtnProps {
    active: boolean
    onClick: () => void
    icon: ComponentType<{ className?: string }>
    label: string
    color?: 'primary' | 'warning' | 'info'
}

function GlowBtn({ active, onClick, icon: Icon, label, color = 'primary' }: GlowBtnProps) {
    const colorClass = color === 'warning'
        ? 'text-amber-500 border-amber-500/60 bg-amber-500/10'
        : color === 'info'
            ? 'text-blue-400 border-blue-400/60 bg-blue-400/10'
            : 'text-[hsl(var(--primary))] border-[hsl(var(--primary)/0.6)] bg-[hsl(var(--primary)/0.12)]'
    const glowColor = color === 'warning'
        ? 'rgba(245,158,11,0.3)'
        : color === 'info'
            ? 'rgba(96,165,250,0.3)'
            : 'hsl(var(--primary) / 0.3)'
    return (
        <button
            type="button"
            onClick={onClick}
            className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-[11px] font-medium transition-all duration-150',
                active
                    ? colorClass
                    : 'border-[hsl(var(--border))] bg-[hsl(var(--surface))] text-[hsl(var(--foreground-muted))] hover:text-[hsl(var(--foreground))]',
            )}
            style={active ? { boxShadow: `0 0 0 2px ${glowColor}, 0 0 12px ${glowColor}` } : undefined}
        >
            <Icon className="h-3.5 w-3.5" />
            <span>{label}</span>
        </button>
    )
}

export default function LiveOpsBar() {
    const heatEnabled = useMapStore((s) => s.heatmapEnabled)
    const toggleHeat = useMapStore((s) => s.toggleHeatmap)
    const districtPanelView = useMapStore((s) => s.districtPanelView)
    const sidePanelMode = useMapStore((s) => s.sidePanelMode)
    const setSidePanelMode = useMapStore((s) => s.setSidePanelMode)
    const setDistrictPanelView = useMapStore((s) => s.setDistrictPanelView)

    const drivers = useLiveStore((s) => s.drivers)
    const deliveries = useLiveStore((s) => s.deliveries)
    const anomalyQueue = useLiveStore((s) => s.anomalyQueue)

    const kpi = useMemo(() => {
        const dList = Object.values(drivers)
        const active = dList.filter((d) => d.status !== 'offline').length
        const inTransit = dList.filter((d) => d.status === 'in-transit').length
        const stalled = dList.filter((d) => d.stalledSince !== null).length
        const delivering = Object.values(deliveries).filter(
            (d) => d.status === 'InTransit' && d.etaSeconds != null,
        )
        const avgEta = delivering.length
            ? Math.round(delivering.reduce((sum, d) => sum + (d.etaSeconds ?? 0), 0) / delivering.length)
            : null
        return { active, inTransit, stalled, avgEta, alerts: anomalyQueue.length }
    }, [drivers, deliveries, anomalyQueue])

    const searchActive = sidePanelMode === 'district' && districtPanelView === 'browse'

    return (
        <div className="flex items-center gap-2 px-3 py-1.5 bg-[hsl(var(--surface))] border-b border-[hsl(var(--border))] flex-wrap">
            <div className="flex items-center gap-2 flex-1 flex-wrap">
                <KpiChip label="Active" value={kpi.active} />
                <KpiChip label="In-transit" value={kpi.inTransit} />
                <KpiChip label="Avg ETA" value={formatEta(kpi.avgEta)} />
                <KpiChip
                    label="Stalled"
                    value={kpi.stalled}
                    accent={kpi.stalled > 0 ? 'text-orange-500' : undefined}
                />
                <KpiChip
                    label="Alerts"
                    value={kpi.alerts}
                    accent={kpi.alerts > 0 ? 'text-amber-500' : undefined}
                />
            </div>
            <div className="flex items-center gap-2">
                <GlowBtn
                    active={heatEnabled}
                    onClick={toggleHeat}
                    icon={Thermometer}
                    label="Heatmap"
                    color="warning"
                />
                <GlowBtn
                    active={searchActive}
                    onClick={() => {
                        setDistrictPanelView('browse')
                        setSidePanelMode('district')
                    }}
                    icon={Search}
                    label="Search"
                />
            </div>
        </div>
    )
}
