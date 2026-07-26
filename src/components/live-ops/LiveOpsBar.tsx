import { useEffect, useMemo, type ComponentType } from 'react'
import { AlertTriangle, Bell, Clock, Search, Thermometer, Truck, Users } from 'lucide-react'
import { useMapStore } from '@/store/mapStore'
import { useLiveStore } from '@/store/liveStore'
import { cn } from '@/lib/utils'
import { Separator } from '@/components/ui/separator'

const LOOKBACK_REFRESH_MS = 2 * 60 * 1000

function formatEta(s: number | null): string {
    if (s == null) return '—'
    const m = Math.floor(s / 60)
    return m >= 60 ? `${Math.floor(m / 60)}h ${m % 60}m` : m > 0 ? `${m}m` : `${s}s`
}

function computeLookbackRange(lookbackHours: number) {
    const to = new Date()
    const from = new Date(to.getTime() - lookbackHours * 60 * 60 * 1000)
    return { from: from.toISOString(), to: to.toISOString() }
}

interface KpiChipProps {
    label: string
    value: string | number
    icon?: ComponentType<{ size?: number; className?: string }>
    accent?: string
    active?: boolean
    warn?: boolean
    onClick?: () => void
}

function KpiChip({ label, value, icon: Icon, accent, active, warn, onClick }: KpiChipProps) {
    const Wrapper = onClick ? 'button' : 'div'
    return (
        <Wrapper
            {...(onClick ? { type: 'button' as const, onClick } : {})}
            className={cn(
                'flex items-center gap-2.5 px-3 py-1.5 rounded-xl border transition-colors duration-150',
                active
                    ? 'border-orange-500/60 bg-orange-500/15'
                    : 'border-[hsl(var(--border))] bg-[hsl(var(--surface-raised))]',
                onClick && 'cursor-pointer hover:border-[hsl(var(--border-strong,var(--border)))]',
                warn && 'chip-warn',
            )}
        >
            {Icon && (
                <Icon
                    size={13}
                    className={cn('shrink-0', accent ?? 'text-[hsl(var(--foreground-subtle,var(--foreground-muted)))]')}
                />
            )}
            <div className="flex flex-col leading-none">
                <span className={cn('text-sm font-bold tabular-nums', accent ?? 'text-[hsl(var(--foreground))]')}>
                    {value}
                </span>
                <span className="text-[9px] text-[hsl(var(--foreground-muted))] uppercase tracking-wide font-medium mt-0.5">
                    {label}
                </span>
            </div>
        </Wrapper>
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
            style={active ? { boxShadow: `0 0 0 2px ${glowColor}, 0 0 10px ${glowColor}` } : undefined}
        >
            <Icon className="h-3.5 w-3.5" />
            <span>{label}</span>
        </button>
    )
}

export default function LiveOpsBar() {
    const heatEnabled             = useMapStore((s) => s.historicalHeatmapEnabled)
    const toggleHeat              = useMapStore((s) => s.toggleHistoricalHeatmap)
    const lookbackHours           = useMapStore((s) => s.lookbackHours)
    const setLookbackHours        = useMapStore((s) => s.setLookbackHours)
    const setHistoricalHeatmapRange = useMapStore((s) => s.setHistoricalHeatmapRange)
    const staffingEnabled         = useMapStore((s) => s.staffingEnabled)
    const toggleStaffing          = useMapStore((s) => s.toggleStaffing)
    const stalledOnly             = useMapStore((s) => s.stalledOnly)
    const toggleStalledOnly       = useMapStore((s) => s.toggleStalledOnly)
    const districtPanelView       = useMapStore((s) => s.districtPanelView)
    const sidePanelMode           = useMapStore((s) => s.sidePanelMode)
    const setSidePanelMode        = useMapStore((s) => s.setSidePanelMode)
    const setDistrictPanelView    = useMapStore((s) => s.setDistrictPanelView)

    const drivers      = useLiveStore((s) => s.drivers)
    const deliveries   = useLiveStore((s) => s.deliveries)
    const anomalyQueue = useLiveStore((s) => s.anomalyQueue)

    const kpi = useMemo(() => {
        const dList = Object.values(drivers)
        const active = dList.filter((d) => d.status !== 'offline').length
        const inTransit = dList.filter((d) => d.status === 'in-transit').length
        const stalled = dList.filter((d) => d.stalledSince !== null).length
        const delivering = Object.values(deliveries).filter(
            (d) => d.status === 'InTransit' && d.etaDeadline != null,
        )
        const avgEta = delivering.length
            ? Math.round(
                delivering.reduce(
                    (sum, d) => sum + Math.max(0, Math.floor((new Date(d.etaDeadline!).getTime() - Date.now()) / 1000)),
                    0,
                ) / delivering.length,
            )
            : null
        return { active, inTransit, stalled, avgEta, alerts: anomalyQueue.length }
    }, [drivers, deliveries, anomalyQueue])

    useEffect(() => {
        if (!heatEnabled) return
        setHistoricalHeatmapRange(computeLookbackRange(lookbackHours))
        const id = setInterval(
            () => setHistoricalHeatmapRange(computeLookbackRange(lookbackHours)),
            LOOKBACK_REFRESH_MS,
        )
        return () => clearInterval(id)
    }, [heatEnabled, lookbackHours, setHistoricalHeatmapRange])

    const searchActive = sidePanelMode === 'district' && districtPanelView === 'browse'

    return (
        <div className="flex items-center gap-2 px-3 py-2 bg-[hsl(var(--surface))] border-b border-[hsl(var(--border))] flex-wrap">
            {/* KPI chips */}
            <div className="flex items-center gap-1.5 flex-1 flex-wrap">
                <KpiChip
                    label="Active"
                    value={kpi.active}
                    icon={Users}
                />
                <KpiChip
                    label="In-transit"
                    value={kpi.inTransit}
                    icon={Truck}
                    accent={kpi.inTransit > 0 ? 'text-[hsl(var(--primary))]' : undefined}
                />
                <KpiChip
                    label="Avg ETA"
                    value={formatEta(kpi.avgEta)}
                    icon={Clock}
                />
                <KpiChip
                    label="Stalled"
                    value={kpi.stalled}
                    icon={AlertTriangle}
                    accent={kpi.stalled > 0 ? 'text-orange-500' : undefined}
                    active={stalledOnly}
                    warn={kpi.stalled > 0}
                    onClick={toggleStalledOnly}
                />
                <KpiChip
                    label="Alerts"
                    value={kpi.alerts}
                    icon={Bell}
                    accent={kpi.alerts > 0 ? 'text-amber-500' : undefined}
                    warn={kpi.alerts > 0}
                />
            </div>

            <Separator orientation="vertical" className="h-8 mx-1" />

            {/* Toggle buttons */}
            <div className="flex items-center gap-1.5">
                <GlowBtn
                    active={stalledOnly}
                    onClick={toggleStalledOnly}
                    icon={AlertTriangle}
                    label="Stalled"
                    color="warning"
                />
                <GlowBtn
                    active={heatEnabled}
                    onClick={toggleHeat}
                    icon={Thermometer}
                    label="Heatmap"
                    color="warning"
                />
                {heatEnabled && (
                    <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg border border-amber-500/40 bg-amber-500/10">
                        <span className="text-[10px] text-amber-500 uppercase tracking-wide font-medium whitespace-nowrap">
                            Last {lookbackHours}h
                        </span>
                        <input
                            type="range"
                            min={1}
                            max={12}
                            step={1}
                            value={lookbackHours}
                            onChange={(e) => setLookbackHours(Number(e.target.value))}
                            className="w-20 slider-styled slider-amber"
                            aria-label="Heatmap lookback hours"
                        />
                    </div>
                )}
                <GlowBtn
                    active={staffingEnabled}
                    onClick={toggleStaffing}
                    icon={Users}
                    label="Staffing"
                    color="info"
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
