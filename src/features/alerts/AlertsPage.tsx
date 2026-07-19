import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Badge } from '@/components/ui'
import { cn } from '@/lib/utils'
import { APP_CONFIG } from '@/config/app.config'
import { useAlerts } from '@/lib/api/queries/useAlerts'
import { useDeliveryRecommendation } from '@/lib/api/queries/useDeliveryRecommendation'
import { useMapStore } from '@/store/mapStore'
import { useLiveStore } from '@/store/liveStore'
import { getMapRef } from '@/lib/mapRef'
import type { AnomalyAlertDto } from '@/types/api'
// import type { AnomalyIncident } from '@/types/hub'

type UrgencyFilter = 'all' | 'critical' | 'high' | 'low'
type AnomalyTypeFilter = 'all' | AnomalyAlertDto['anomalyType']

const TYPE_OPTIONS: { value: AnomalyTypeFilter; label: string }[] = [
    { value: 'all', label: 'All types' },
    { value: 'EtaExceeded', label: 'Delay' },
    { value: 'RouteDeviation', label: 'Route Deviation' },
    { value: 'StalePosition', label: 'Stall' },
    { value: 'UnexpectedStop', label: 'Unexpected Stop' },
]

const TYPE_LABEL_MAP = Object.fromEntries(TYPE_OPTIONS.map((o) => [o.value, o.label]))

function anomalyTypeLabel(type: string): string {
    return TYPE_LABEL_MAP[type] ?? type
}

function urgencyFromType(type: AnomalyAlertDto['anomalyType']): number {
    if (type === 'StalePosition') return 9
    if (type === 'UnexpectedStop') return 8
    if (type === 'EtaExceeded') return 7
    return 5
}

function urgencyColor(u: number) {
    if (u >= 8) return 'hsl(var(--destructive))'
    if (u >= 6) return 'hsl(var(--warning, 38 92% 50%))'
    return 'hsl(var(--primary))'
}

function urgencyBadgeVariant(u: number): 'destructive' | 'warning' | 'outline' {
    if (u >= 8) return 'destructive'
    if (u >= 6) return 'warning'
    return 'outline'
}

function urgencyLabel(u: number) {
    if (u >= 8) return 'Critical'
    if (u >= 6) return 'High'
    if (u >= 4) return 'Moderate'
    return 'Low'
}

function formatTime(ts: string) {
    return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

function AlertAiChip({ deliveryId, urgencyColor, autoLoad = false }: { deliveryId: string; urgencyColor: string; autoLoad?: boolean }) {
    const [enabled, setEnabled] = useState(autoLoad)
    const { data, isLoading } = useDeliveryRecommendation(deliveryId, enabled)

    const note = data
        ? data.aiAvailable && data.recommendedAction
            ? `${data.recommendedAction}${data.reason ? ` — ${data.reason}` : ''}`
            : 'AI offline · top candidates available'
        : null

    if (note) {
        return (
            <div
                className="rounded-md px-3 py-2 text-xs leading-relaxed"
                style={{
                    background: `color-mix(in srgb, ${urgencyColor} 10%, transparent)`,
                    border: `1px solid color-mix(in srgb, ${urgencyColor} 25%, transparent)`,
                    color: urgencyColor,
                }}
            >
                ⚡ {note}
            </div>
        )
    }

    return (
        <button
            type="button"
            onClick={() => setEnabled(true)}
            disabled={isLoading}
            className="self-start text-[11px] px-2.5 py-1 rounded-md border border-[hsl(var(--border))] bg-transparent text-[hsl(var(--foreground-muted))] hover:text-[hsl(var(--foreground))] hover:border-[hsl(var(--border-strong))] transition-colors disabled:opacity-50"
        >
            {isLoading ? '⚡ Loading…' : '⚡ AI insight'}
        </button>
    )
}

interface AlertCardProps {
    type: string
    driverName: string
    driverId: string
    deliveryId?: string
    districtName: string
    reason: string
    urgency: number
    aiNote?: string
    time: string
}

function AlertCard({ type, driverName, driverId, deliveryId, districtName, reason, urgency, aiNote, time }: AlertCardProps) {
    const navigate = useNavigate()
    const selectDriver = useMapStore((s) => s.selectDriver)
    const setSidePanelMode = useMapStore((s) => s.setSidePanelMode)
    const color = urgencyColor(urgency)

    const handleViewOnMap = () => {
        selectDriver(driverId)
        setSidePanelMode('driver')
        const pos = useLiveStore.getState().drivers[driverId]
        if (pos) {
            getMapRef()?.flyTo({ center: [pos.lng, pos.lat], zoom: APP_CONFIG.map.focusZoom, duration: APP_CONFIG.map.flyToDurationMs })
        }
        navigate('/', { state: { focusDriverId: driverId, focusLat: pos?.lat, focusLng: pos?.lng } })
    }

    return (
        <div className={cn(
            'flex gap-3 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--surface))]',
            'p-4 transition-colors hover:border-[hsl(var(--border-strong))]'
        )}>
            {/* Urgency bar */}
            <div className="w-1 shrink-0 rounded-full" style={{ background: color }} />

            <div className="flex-1 min-w-0">
                {/* Header row */}
                <div className="flex flex-wrap items-center gap-2 mb-1.5">
                    <span className="text-xl font-extrabold font-mono leading-none" style={{ color }}>{urgency}</span>
                    <span className="text-xs text-[hsl(var(--foreground-muted))]">/ 10</span>
                    <Badge variant={urgencyBadgeVariant(urgency)}>{urgencyLabel(urgency)}</Badge>
                    <Badge variant="outline">{anomalyTypeLabel(type)}</Badge>
                    <span className="ml-auto text-[11px] font-mono text-[hsl(var(--foreground-subtle,var(--foreground-muted)))]">{time}</span>
                </div>

                {/* Driver + district */}
                <div className="flex items-baseline gap-1.5 mb-1">
                    <span className="font-semibold text-sm text-[hsl(var(--foreground))]">{driverName}</span>
                    <span className="text-xs text-[hsl(var(--foreground-muted))]">· {districtName}</span>
                </div>

                {/* Reason */}
                <p className="text-sm text-[hsl(var(--foreground-muted))] mb-2">{reason}</p>

                {/* AI note — static (mock) or lazy-fetched (API) */}
                {aiNote && (
                    <div className="rounded-md px-3 py-2 text-xs leading-relaxed"
                        style={{
                            background: `color-mix(in srgb, ${color} 10%, transparent)`,
                            border: `1px solid color-mix(in srgb, ${color} 25%, transparent)`,
                            color,
                        }}>
                        ⚡ {aiNote}
                    </div>
                )}
                {!aiNote && deliveryId && (
                    <AlertAiChip deliveryId={deliveryId} urgencyColor={color} />
                )}
            </div>

            {/* Actions */}
            <div className="flex shrink-0 flex-col items-end gap-1.5">
                <button
                    type="button"
                    onClick={handleViewOnMap}
                    className="text-xs px-3 py-1.5 rounded-lg border border-[hsl(var(--border))] bg-transparent text-[hsl(var(--foreground-muted))] hover:bg-[hsl(var(--surface-raised))] hover:text-[hsl(var(--foreground))] transition-colors whitespace-nowrap"
                >
                    View on map
                </button>
                {deliveryId && (
                    <button
                        type="button"
                        onClick={() => navigate('/deliveries', { state: { openTimelineId: deliveryId } })}
                        className="text-xs px-3 py-1.5 rounded-lg border border-[hsl(var(--border))] bg-transparent text-[hsl(var(--foreground-muted))] hover:bg-[hsl(var(--surface-raised))] hover:text-[hsl(var(--foreground))] transition-colors whitespace-nowrap"
                    >
                        Timeline
                    </button>
                )}
            </div>
        </div>
    )
}

// function IncidentCard({ incident }: { incident: AnomalyIncident }) {
//     const time = new Date(incident.detectedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
//     return (
//         <div className="flex gap-3 rounded-xl border border-[hsl(var(--destructive)/0.4)] bg-[hsl(var(--destructive)/0.05)] p-4">
//             <div className="w-1 shrink-0 rounded-full bg-[hsl(var(--destructive))]" />
//             <div className="flex-1 min-w-0">
//                 <div className="flex flex-wrap items-center gap-2 mb-1">
//                     <Badge variant="destructive">Incident</Badge>
//                     <span className="text-xs font-medium text-[hsl(var(--foreground))]">{incident.districtId}</span>
//                     <span className="text-[11px] text-[hsl(var(--foreground-muted))]">
//                         {incident.anomalyCount} anomalies · {incident.windowMinutes} min window
//                     </span>
//                     <span className="ml-auto text-[11px] font-mono text-[hsl(var(--foreground-subtle,var(--foreground-muted)))]">{time}</span>
//                 </div>
//                 <p className="text-sm text-[hsl(var(--foreground-muted))]">{incident.summary}</p>
//             </div>
//         </div>
//     )
// }

// function IncidentAlertsBanner() {
//     const incidents = useLiveStore((s) => s.incidents)
//     if (incidents.length === 0) return null
//     return (
//         <section className="flex flex-col gap-2">
//             <p className="text-[11px] font-semibold uppercase tracking-widest text-[hsl(var(--destructive))]">
//                 Live Incidents
//             </p>
//             {incidents.map((inc) => (
//                 <IncidentCard key={`${inc.districtId}-${inc.detectedAt}`} incident={inc} />
//             ))}
//         </section>
//     )
// }

function ApiAlertsList({ filter, typeFilter }: { filter: UrgencyFilter; typeFilter: AnomalyTypeFilter }) {
    const today = new Date()
    const rangeStart = new Date()
    rangeStart.setDate(today.getDate() - (APP_CONFIG.analytics.defaultRangeDays - 1))

    const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } = useAlerts({
        from: rangeStart.toISOString().slice(0, 10),
        to: today.toISOString().slice(0, 10),
        pageSize: 20,
        anomalyType: typeFilter !== 'all' ? typeFilter : undefined,
    })

    const allRows = useMemo(() => data?.pages.flatMap((p) => p.items) ?? [], [data])

    const filtered = useMemo(() => {
        return allRows.filter((a) => {
            if (typeFilter !== 'all' && a.anomalyType !== typeFilter) return false
            const u = urgencyFromType(a.anomalyType)
            if (filter === 'critical') return u >= 8
            if (filter === 'high') return u >= 6 && u < 8
            if (filter === 'low') return u < 6
            return true
        })
    }, [allRows, filter, typeFilter])

    const criticalCount = allRows.filter((a) => urgencyFromType(a.anomalyType) >= 8).length

    if (isLoading) {
        return <p className="py-12 text-center text-sm text-[hsl(var(--foreground-muted))]">Loading alerts…</p>
    }

    return (
        <>
            {allRows.length > 0 && (
                <div className="flex items-center gap-2 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--primary)/0.08)] px-4 py-3 text-sm text-[hsl(var(--primary))]">
                    <span>⚡</span>
                    <span>AI ranked {allRows.length} alerts by urgency · {criticalCount} require immediate action</span>
                </div>
            )}
            <div className="flex flex-col gap-3">
                {filtered.map((a) => (
                    <AlertCard
                        key={a.id}
                        type={a.anomalyType}
                        driverName={a.driverName}
                        driverId={a.driverId}
                        deliveryId={a.deliveryId}
                        districtName={a.districtName}
                        reason={a.reason}
                        urgency={urgencyFromType(a.anomalyType)}
                        time={formatTime(a.timestamp)}
                    />
                ))}
                {filtered.length === 0 && !isLoading && (
                    <p className="py-12 text-center text-sm text-[hsl(var(--foreground-muted))]">No alerts match this filter.</p>
                )}
            </div>
            {hasNextPage && (
                <button
                    type="button"
                    onClick={() => fetchNextPage()}
                    disabled={isFetchingNextPage}
                    className="w-full py-2.5 text-sm text-[hsl(var(--primary))] border-t border-[hsl(var(--border))] bg-transparent hover:bg-[hsl(var(--surface-raised))] transition-colors"
                >
                    {isFetchingNextPage ? 'Loading…' : 'Load more'}
                </button>
            )}
        </>
    )
}

export default function AlertsPage() {
    const [filter, setFilter] = useState<UrgencyFilter>('all')
    const [typeFilter, setTypeFilter] = useState<AnomalyTypeFilter>('all')

    const urgencyOptions: { value: UrgencyFilter; label: string }[] = [
        { value: 'all', label: 'All' },
        { value: 'critical', label: 'Critical' },
        { value: 'high', label: 'High' },
        { value: 'low', label: 'Low' },
    ]

    return (
        <div className="flex flex-col gap-4 p-6">
            <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                    <h1 className="text-xl font-semibold tracking-tight text-[hsl(var(--foreground))]">Alerts</h1>
                    <p className="text-xs text-[hsl(var(--foreground-muted))]">AI-triaged anomaly queue · sorted by urgency</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    <select
                        value={typeFilter}
                        onChange={(e) => setTypeFilter(e.target.value as AnomalyTypeFilter)}
                        className="h-8 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--surface))] px-2 text-xs text-[hsl(var(--foreground-muted))]"
                    >
                        {TYPE_OPTIONS.map((opt) => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                    </select>
                    <div className="flex gap-1.5">
                        {urgencyOptions.map((opt) => (
                            <button
                                key={opt.value}
                                type="button"
                                onClick={() => setFilter(opt.value)}
                                className={cn(
                                    'px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors',
                                    filter === opt.value
                                        ? 'border-[hsl(var(--primary))] bg-[hsl(var(--primary)/0.12)] text-[hsl(var(--primary))]'
                                        : 'border-[hsl(var(--border))] bg-transparent text-[hsl(var(--foreground-muted))] hover:bg-[hsl(var(--surface-raised))]'
                                )}
                            >
                                {opt.label}
                            </button>
                        ))}
                    </div>
                </div>
            </header>

            <ApiAlertsList filter={filter} typeFilter={typeFilter} />
        </div>
    )
}
