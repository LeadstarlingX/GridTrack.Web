import { useState } from 'react'
import { ChevronRight, ChevronLeft, AlertTriangle, AlertOctagon, Clock, Navigation } from 'lucide-react'
import { useLiveStore } from '@/store/liveStore'
import { cn } from '@/lib/utils'
import type { AnomalyType } from '@/types/hub'
import { useNavigate } from 'react-router-dom'

const ANOMALY_META: Record<AnomalyType, { label: string; color: string; Icon: React.ComponentType<{ size?: number; className?: string }> }> = {
    EtaExceeded:    { label: 'ETA exceeded',    color: 'text-amber-500',  Icon: Clock },
    RouteDeviation: { label: 'Route deviation', color: 'text-red-500',    Icon: Navigation },
    StalePosition:  { label: 'Stale position',  color: 'text-orange-500', Icon: AlertTriangle },
    UnexpectedStop: { label: 'Unexpected stop', color: 'text-red-600',    Icon: AlertOctagon },
}

function timeAgo(iso: string): string {
    const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000)
    if (diff < 60) return `${diff}s ago`
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
    return `${Math.floor(diff / 3600)}h ago`
}

export default function AlertTriagePanel() {
    const alerts = useLiveStore((s) => s.anomalyQueue)
    const navigate = useNavigate()
    const [collapsed, setCollapsed] = useState(false)

    const preview = alerts.slice(0, 5)
    const hasAlerts = alerts.length > 0

    return (
        <div className={cn(
            'absolute top-4 left-2 z-[900] flex flex-col transition-all duration-200',
            collapsed ? 'w-9' : 'w-64',
        )}>
            {/* Toggle tab */}
            <button
                type="button"
                onClick={() => setCollapsed((c) => !c)}
                className={cn(
                    'self-start flex items-center gap-1 px-2 py-1 rounded-t-lg text-[10px] font-semibold uppercase tracking-wide',
                    'bg-[hsl(var(--surface))] border border-b-0 border-[hsl(var(--border))] text-[hsl(var(--foreground-muted))]',
                    hasAlerts && !collapsed && 'text-amber-500',
                )}
            >
                {!collapsed && (
                    <span>
                        Alerts{alerts.length > 0 && <span className="ml-1 tabular-nums">{alerts.length}</span>}
                    </span>
                )}
                {collapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
            </button>

            {!collapsed && (
                <div className="rounded-b-lg rounded-tr-lg border border-[hsl(var(--border))] bg-[hsl(var(--surface))] shadow-lg overflow-hidden">
                    {preview.length === 0 ? (
                        <p className="px-3 py-3 text-xs text-[hsl(var(--foreground-muted))]">No active alerts</p>
                    ) : (
                        <ul className="divide-y divide-[hsl(var(--border))]">
                            {preview.map((alert) => {
                                const meta = ANOMALY_META[alert.anomalyType] ?? ANOMALY_META.StalePosition
                                const { Icon } = meta
                                return (
                                    <li key={alert.id} className="px-3 py-2">
                                        <div className="flex items-start gap-2">
                                            <Icon size={13} className={cn('mt-0.5 shrink-0', meta.color)} />
                                            <div className="min-w-0 flex-1">
                                                <p className={cn('text-xs font-semibold leading-tight truncate', meta.color)}>{meta.label}</p>
                                                <p className="text-[11px] text-[hsl(var(--foreground-muted))] truncate">{alert.driverName}</p>
                                                <p className="text-[10px] text-[hsl(var(--foreground-subtle))]">{timeAgo(alert.timestamp)}</p>
                                            </div>
                                        </div>
                                    </li>
                                )
                            })}
                        </ul>
                    )}

                    {alerts.length > 5 && (
                        <button
                            type="button"
                            onClick={() => navigate('/alerts')}
                            className="w-full px-3 py-2 text-[11px] text-[hsl(var(--primary))] hover:bg-[hsl(var(--surface-raised))] transition-colors border-t border-[hsl(var(--border))]"
                        >
                            View all {alerts.length} alerts →
                        </button>
                    )}
                </div>
            )}
        </div>
    )
}
