import { useState, useEffect, type ElementType } from 'react'
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetDescription,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useDeliveryTimeline } from '@/lib/api/queries/useDeliveryTimeline'
import { useDelivery } from '@/lib/api/queries/useDelivery'
import { useDrivers } from '@/lib/api/queries/useDrivers'
import { useDeliveryRecommendation } from '@/lib/api/queries/useDeliveryRecommendation'
import {
    useAssignDriver,
    usePickUpDelivery,
    useMarkDelivered,
    useCancelDelivery,
    useFlagAnomaly,
} from '@/lib/api/queries/useDeliveryActions'
import { useAutoAssign } from '@/lib/api/queries/useAutoAssign'
import { useEtaCountdown } from '@/hooks/useEtaCountdown'
import { useLiveStore } from '@/store/liveStore'
import type { DeliveryTimelineEventDto, DeliveryStatus, AnomalyType } from '@/types/api'
import {
    PackagePlus,
    UserCheck,
    Package,
    Truck,
    PackageCheck,
    XCircle,
    AlertTriangle,
    Loader2,
    ChevronLeft,
    UserSearch,
    Sparkles,
    Timer,
    MapPin,
    BrainCircuit,
} from 'lucide-react'

interface Props {
    deliveryId: string | null
    onClose: () => void
}

function fmt(iso: string | null) {
    if (!iso) return null
    return new Date(iso).toLocaleString([], {
        month: 'short', day: 'numeric',
        hour: '2-digit', minute: '2-digit',
    })
}

type EventType = DeliveryTimelineEventDto['type']

const EVENT_META: Record<EventType, { icon: ElementType; color: string }> = {
    Created:        { icon: PackagePlus,   color: 'text-blue-400' },
    Assigned:       { icon: UserCheck,     color: 'text-violet-400' },
    PickedUp:       { icon: Package,       color: 'text-amber-400' },
    InTransit:      { icon: Truck,         color: 'text-sky-400' },
    Delivered:      { icon: PackageCheck,  color: 'text-green-400' },
    Cancelled:      { icon: XCircle,       color: 'text-red-400' },
    AnomalyFlagged: { icon: AlertTriangle, color: 'text-orange-400' },
}

function TimelineEvent({ event, isLast }: { event: DeliveryTimelineEventDto; isLast: boolean }) {
    const meta = EVENT_META[event.type]
    const Icon = meta.icon
    const time = fmt(event.at)

    return (
        <div className="relative flex gap-4">
            {!isLast && (
                <div className="absolute left-[18px] top-8 bottom-0 w-px bg-[hsl(var(--border))]" />
            )}
            <div className="relative z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[hsl(var(--border))] bg-[hsl(var(--surface))]">
                <Icon size={16} className={meta.color} />
            </div>
            <div className="flex min-w-0 flex-1 flex-col pb-6">
                <div className="flex items-baseline gap-2">
                    <span className="text-sm font-medium text-[hsl(var(--foreground))]">{event.label}</span>
                    {time && (
                        <span className="shrink-0 text-[11px] text-[hsl(var(--foreground-muted))]">{time}</span>
                    )}
                </div>
                {event.note && (
                    <p className="mt-0.5 text-xs text-[hsl(var(--foreground-muted))] leading-relaxed">{event.note}</p>
                )}
            </div>
        </div>
    )
}

const STATUS_BADGE: Record<DeliveryStatus, { label: string; className: string }> = {
    Created:   { label: 'Created',    className: 'bg-blue-500/15 text-blue-400 border-blue-500/30' },
    Assigned:  { label: 'Assigned',   className: 'bg-violet-500/15 text-violet-400 border-violet-500/30' },
    PickedUp:  { label: 'Picked Up',  className: 'bg-amber-500/15 text-amber-400 border-amber-500/30' },
    InTransit: { label: 'In Transit', className: 'bg-sky-500/15 text-sky-400 border-sky-500/30' },
    Delivered: { label: 'Delivered',  className: 'bg-green-500/15 text-green-400 border-green-500/30' },
    Cancelled: { label: 'Cancelled',  className: 'bg-red-500/15 text-red-400 border-red-500/30' },
    Anomalous: { label: 'Anomalous',  className: 'bg-orange-500/15 text-orange-400 border-orange-500/30' },
}

const TERMINAL: DeliveryStatus[] = ['Delivered', 'Cancelled']

const ANOMALY_OPTIONS: { value: AnomalyType; label: string }[] = [
    { value: 'EtaExceeded',    label: 'ETA Exceeded' },
    { value: 'RouteDeviation', label: 'Route Deviation' },
    { value: 'StalePosition',  label: 'Stale Position' },
    { value: 'UnexpectedStop', label: 'Unexpected Stop' },
]

type ActionMode = null | 'assign' | 'auto-assign' | 'cancel' | 'flag'

const inputCls =
    'w-full rounded-md border border-[hsl(var(--border))] bg-[hsl(var(--surface))] px-3 py-2 text-sm text-[hsl(var(--foreground))] placeholder:text-[hsl(var(--foreground-muted))] focus:outline-none focus:ring-1 focus:ring-[hsl(var(--ring))] resize-none'

export default function DeliveryTimelineDrawer({ deliveryId, onClose }: Props) {
    const [actionMode, setActionMode] = useState<ActionMode>(null)
    const [cancelReason, setCancelReason] = useState('')
    const [anomalyType, setAnomalyType] = useState<AnomalyType | ''>('')
    const [anomalyReason, setAnomalyReason] = useState('')

    useEffect(() => {
        setActionMode(null)
        setCancelReason('')
        setAnomalyType('')
        setAnomalyReason('')
    }, [deliveryId])

    const resetForms = () => {
        setActionMode(null)
        setCancelReason('')
        setAnomalyType('')
        setAnomalyReason('')
    }

    const { data: timeline, isLoading, isError } = useDeliveryTimeline(deliveryId)
    const { data: delivery } = useDelivery(deliveryId)
    const { data: recommendation } = useDeliveryRecommendation(
        deliveryId,
        delivery?.status === 'InTransit' || delivery?.status === 'Assigned',
    )

    // Live ETA from SignalR store — more up-to-date than the REST response
    const liveEtaSeconds = useLiveStore((s) =>
        deliveryId ? (s.deliveries[deliveryId]?.etaSeconds ?? null) : null,
    )
    const etaDisplay = useEtaCountdown(liveEtaSeconds ?? delivery?.etaSeconds ?? null)

    const { data: driversData, isLoading: driversLoading } = useDrivers(
        { status: 'available', pageSize: 15 },
        { enabled: actionMode === 'assign' },
    )
    const availableDrivers = driversData?.pages.flatMap((p) => p.items) ?? []

    const status = delivery?.status
    const isTerminal = status ? TERMINAL.includes(status) : false
    const statusMeta = status ? STATUS_BADGE[status] : null

    const assign      = useAssignDriver(deliveryId, resetForms)
    const pickUp      = usePickUpDelivery(deliveryId, resetForms)
    const deliver     = useMarkDelivered(deliveryId, resetForms)
    const cancel      = useCancelDelivery(deliveryId, resetForms)
    const flag        = useFlagAnomaly(deliveryId, resetForms)
    const autoAssign  = useAutoAssign(deliveryId)

    return (
        <Sheet open={deliveryId !== null} onOpenChange={(open) => { if (!open) onClose() }}>
            <SheetContent side="right" className="w-full sm:max-w-md flex flex-col gap-0 p-0">

                {/* Header */}
                <SheetHeader className="border-b border-[hsl(var(--border))] px-6 py-5">
                    <div className="flex items-center justify-between gap-3">
                        <SheetTitle>Delivery Timeline</SheetTitle>
                        {statusMeta && (
                            <Badge variant="outline" className={`shrink-0 text-xs ${statusMeta.className}`}>
                                {statusMeta.label}
                            </Badge>
                        )}
                    </div>
                    <SheetDescription className="font-mono text-xs truncate">
                        {deliveryId ?? '—'}
                    </SheetDescription>
                </SheetHeader>

                {/* Live info strip — ETA / cost / AI */}
                {delivery && (status === 'InTransit' || delivery.routeCost != null || recommendation?.aiAvailable) && (
                    <div className="shrink-0 border-b border-[hsl(var(--border))] px-6 py-3 space-y-2.5">

                        {/* ETA countdown */}
                        {status === 'InTransit' && (
                            <div className="flex items-center gap-2.5">
                                <Timer size={14} className="shrink-0 text-sky-400" />
                                <span className="text-xs text-[hsl(var(--foreground-muted))]">ETA</span>
                                <span className="ml-auto font-mono text-sm font-semibold text-sky-400 tabular-nums">
                                    {etaDisplay}
                                </span>
                            </div>
                        )}

                        {/* Route cost */}
                        {delivery.routeCost != null && (
                            <div className="flex items-center gap-2.5">
                                <MapPin size={14} className="shrink-0 text-amber-400" />
                                <span className="text-xs text-[hsl(var(--foreground-muted))]">Route cost</span>
                                <span className="ml-auto text-sm font-semibold text-amber-400">
                                    {delivery.routeCost.toFixed(0)} SYP
                                </span>
                            </div>
                        )}

                        {/* AI recommendation */}
                        {recommendation?.aiAvailable && (recommendation.urgencyScore != null || recommendation.recommendedAction) && (
                            <div className="rounded-md border border-[hsl(var(--border))] bg-[hsl(var(--surface))] px-3 py-2.5 space-y-1">
                                <div className="flex items-center gap-1.5">
                                    <BrainCircuit size={13} className="shrink-0 text-violet-400" />
                                    <span className="text-[11px] font-medium text-violet-400 uppercase tracking-wider">
                                        AI
                                    </span>
                                    {recommendation.urgencyScore != null && (
                                        <span className={`ml-auto text-xs font-semibold tabular-nums ${
                                            recommendation.urgencyScore >= 0.7 ? 'text-red-400' :
                                            recommendation.urgencyScore >= 0.4 ? 'text-amber-400' :
                                            'text-green-400'
                                        }`}>
                                            urgency {(recommendation.urgencyScore * 100).toFixed(0)}%
                                        </span>
                                    )}
                                </div>
                                {recommendation.recommendedAction && (
                                    <p className="text-xs font-medium text-[hsl(var(--foreground))]">
                                        {recommendation.recommendedAction}
                                    </p>
                                )}
                                {recommendation.reason && (
                                    <p className="text-[11px] text-[hsl(var(--foreground-muted))] leading-relaxed">
                                        {recommendation.reason}
                                    </p>
                                )}
                            </div>
                        )}
                    </div>
                )}

                {/* Scrollable timeline */}
                <div className="flex-1 overflow-y-auto px-6 py-6">
                    {isLoading && (
                        <div className="flex items-center gap-2 text-sm text-[hsl(var(--foreground-muted))]">
                            <Loader2 size={14} className="animate-spin" />
                            Loading timeline…
                        </div>
                    )}
                    {isError && (
                        <p className="text-sm text-red-400">Failed to load timeline.</p>
                    )}
                    {timeline && timeline.events.length === 0 && (
                        <p className="text-sm text-[hsl(var(--foreground-muted))]">No events yet.</p>
                    )}
                    {timeline && timeline.events.length > 0 && (
                        <div>
                            {timeline.events.map((event, i) => (
                                <TimelineEvent
                                    key={`${event.type}-${i}`}
                                    event={event}
                                    isLast={i === timeline.events.length - 1}
                                />
                            ))}
                        </div>
                    )}
                </div>

                {/* Action panel */}
                {!isTerminal && delivery && (
                    <div className="shrink-0 border-t border-[hsl(var(--border))] px-6 py-4 space-y-3">

                        {/* Default: status-appropriate action buttons */}
                        {actionMode === null && (
                            <>
                                {status === 'Created' && (
                                    <>
                                        <Button
                                            className="w-full"
                                            disabled={autoAssign.isPending}
                                            onClick={() => {
                                                setActionMode('auto-assign')
                                                autoAssign.mutate()
                                            }}
                                        >
                                            {autoAssign.isPending
                                                ? <Loader2 size={15} className="mr-2 animate-spin" />
                                                : <Sparkles size={15} className="mr-2" />}
                                            Auto-assign
                                        </Button>
                                        <Button
                                            variant="outline"
                                            className="w-full"
                                            onClick={() => setActionMode('assign')}
                                        >
                                            <UserSearch size={15} className="mr-2" />
                                            Assign Manually
                                        </Button>
                                    </>
                                )}
                                {status === 'Assigned' && (
                                    <Button
                                        className="w-full bg-amber-500 hover:bg-amber-600 text-white"
                                        disabled={pickUp.isPending}
                                        onClick={() => pickUp.mutate()}
                                    >
                                        {pickUp.isPending
                                            ? <Loader2 size={15} className="mr-2 animate-spin" />
                                            : <Package size={15} className="mr-2" />}
                                        Mark Picked Up
                                    </Button>
                                )}
                                {(status === 'PickedUp' || status === 'InTransit' || status === 'Anomalous') && (
                                    <Button
                                        className="w-full bg-green-600 hover:bg-green-700 text-white"
                                        disabled={deliver.isPending}
                                        onClick={() => deliver.mutate()}
                                    >
                                        {deliver.isPending
                                            ? <Loader2 size={15} className="mr-2 animate-spin" />
                                            : <PackageCheck size={15} className="mr-2" />}
                                        Mark Delivered
                                    </Button>
                                )}

                                <div className="flex gap-2">
                                    {(status === 'Created' || status === 'Assigned') && (
                                        <Button
                                            variant="outline"
                                            className="flex-1 border-red-500/40 text-red-400 hover:bg-red-500/10 hover:text-red-300"
                                            onClick={() => setActionMode('cancel')}
                                        >
                                            <XCircle size={14} className="mr-1.5" />
                                            Cancel
                                        </Button>
                                    )}
                                    {status !== 'Anomalous' && (
                                        <Button
                                            variant="outline"
                                            className="flex-1 border-orange-500/40 text-orange-400 hover:bg-orange-500/10 hover:text-orange-300"
                                            onClick={() => setActionMode('flag')}
                                        >
                                            <AlertTriangle size={14} className="mr-1.5" />
                                            Flag Anomaly
                                        </Button>
                                    )}
                                </div>
                            </>
                        )}

                        {/* Auto-assign result */}
                        {actionMode === 'auto-assign' && (
                            <div className="space-y-3">
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={resetForms}
                                        className="text-[hsl(var(--foreground-muted))] hover:text-[hsl(var(--foreground))] transition-colors"
                                    >
                                        <ChevronLeft size={16} />
                                    </button>
                                    <span className="text-sm font-medium text-[hsl(var(--foreground))]">
                                        Auto-assign Result
                                    </span>
                                </div>

                                {autoAssign.isPending && (
                                    <div className="flex items-center gap-2 text-sm text-[hsl(var(--foreground-muted))] py-2">
                                        <Loader2 size={13} className="animate-spin" />
                                        Finding best driver…
                                    </div>
                                )}

                                {autoAssign.data?.autoAssigned && (
                                    <div className="rounded-md px-3 py-2.5 text-xs bg-green-500/10 border border-green-500/25 text-green-400">
                                        ✓ Driver assigned automatically
                                    </div>
                                )}

                                {autoAssign.data && !autoAssign.data.autoAssigned && (
                                    <>
                                        <p className="text-xs text-[hsl(var(--foreground-muted))]">
                                            Score gap too narrow for automatic assignment. Select a candidate:
                                        </p>
                                        <div className="max-h-48 overflow-y-auto space-y-1 -mx-1 px-1">
                                            {autoAssign.data.topCandidates.map((c) => (
                                                <button
                                                    key={c.driverId}
                                                    disabled={assign.isPending}
                                                    onClick={() => assign.mutate(c.driverId)}
                                                    className="w-full flex items-center justify-between rounded-md px-3 py-2 text-sm text-left hover:bg-[hsl(var(--surface-raised,var(--surface)))] border border-transparent hover:border-[hsl(var(--border))] transition-colors disabled:opacity-50"
                                                >
                                                    <div>
                                                        <span className="font-medium text-[hsl(var(--foreground))]">
                                                            {c.name}
                                                        </span>
                                                        <span className="ml-2 text-xs text-[hsl(var(--foreground-muted))]">
                                                            {c.districtId}
                                                        </span>
                                                    </div>
                                                    <span className="shrink-0 font-mono text-xs text-[hsl(var(--foreground-muted))]">
                                                        {(c.score * 100).toFixed(0)}
                                                    </span>
                                                </button>
                                            ))}
                                        </div>
                                    </>
                                )}
                            </div>
                        )}

                        {/* Assign driver picker */}
                        {actionMode === 'assign' && (
                            <div className="space-y-3">
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => setActionMode(null)}
                                        className="text-[hsl(var(--foreground-muted))] hover:text-[hsl(var(--foreground))] transition-colors"
                                    >
                                        <ChevronLeft size={16} />
                                    </button>
                                    <span className="text-sm font-medium text-[hsl(var(--foreground))]">
                                        Select Available Driver
                                    </span>
                                </div>

                                {driversLoading && (
                                    <div className="flex items-center gap-2 text-sm text-[hsl(var(--foreground-muted))] py-2">
                                        <Loader2 size={13} className="animate-spin" />
                                        Loading drivers…
                                    </div>
                                )}

                                {!driversLoading && availableDrivers.length === 0 && (
                                    <p className="text-sm text-[hsl(var(--foreground-muted))] py-2">
                                        No available drivers right now.
                                    </p>
                                )}

                                {availableDrivers.length > 0 && (
                                    <div className="max-h-48 overflow-y-auto space-y-1 -mx-1 px-1">
                                        {availableDrivers.map((driver) => (
                                            <button
                                                key={driver.id}
                                                disabled={assign.isPending}
                                                onClick={() => assign.mutate(driver.id)}
                                                className="w-full flex items-center justify-between rounded-md px-3 py-2 text-sm text-left hover:bg-[hsl(var(--surface-raised,var(--surface)))] border border-transparent hover:border-[hsl(var(--border))] transition-colors disabled:opacity-50"
                                            >
                                                <div>
                                                    <span className="font-medium text-[hsl(var(--foreground))]">
                                                        {driver.name}
                                                    </span>
                                                    <span className="ml-2 text-xs text-[hsl(var(--foreground-muted))]">
                                                        {driver.districtName}
                                                    </span>
                                                </div>
                                                {assign.isPending && assign.variables === driver.id && (
                                                    <Loader2 size={13} className="animate-spin text-[hsl(var(--foreground-muted))]" />
                                                )}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Cancel form */}
                        {actionMode === 'cancel' && (
                            <div className="space-y-3">
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => setActionMode(null)}
                                        className="text-[hsl(var(--foreground-muted))] hover:text-[hsl(var(--foreground))] transition-colors"
                                    >
                                        <ChevronLeft size={16} />
                                    </button>
                                    <span className="text-sm font-medium text-[hsl(var(--foreground))]">
                                        Cancel Delivery
                                    </span>
                                </div>
                                <textarea
                                    className={inputCls}
                                    rows={3}
                                    placeholder="Reason for cancellation…"
                                    value={cancelReason}
                                    onChange={(e) => setCancelReason(e.target.value)}
                                />
                                <Button
                                    className="w-full bg-red-600 hover:bg-red-700 text-white"
                                    disabled={!cancelReason.trim() || cancel.isPending}
                                    onClick={() => cancel.mutate(cancelReason.trim())}
                                >
                                    {cancel.isPending
                                        ? <Loader2 size={15} className="mr-2 animate-spin" />
                                        : <XCircle size={15} className="mr-2" />}
                                    Confirm Cancel
                                </Button>
                            </div>
                        )}

                        {/* Flag anomaly form */}
                        {actionMode === 'flag' && (
                            <div className="space-y-3">
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => setActionMode(null)}
                                        className="text-[hsl(var(--foreground-muted))] hover:text-[hsl(var(--foreground))] transition-colors"
                                    >
                                        <ChevronLeft size={16} />
                                    </button>
                                    <span className="text-sm font-medium text-[hsl(var(--foreground))]">
                                        Flag Anomaly
                                    </span>
                                </div>
                                <select
                                    className={inputCls}
                                    value={anomalyType}
                                    onChange={(e) => setAnomalyType(e.target.value as AnomalyType)}
                                >
                                    <option value="" disabled>Select anomaly type…</option>
                                    {ANOMALY_OPTIONS.map((opt) => (
                                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                                    ))}
                                </select>
                                <textarea
                                    className={inputCls}
                                    rows={2}
                                    placeholder="Describe the anomaly…"
                                    value={anomalyReason}
                                    onChange={(e) => setAnomalyReason(e.target.value)}
                                />
                                <Button
                                    className="w-full bg-orange-500 hover:bg-orange-600 text-white"
                                    disabled={!anomalyType || !anomalyReason.trim() || flag.isPending}
                                    onClick={() =>
                                        flag.mutate({ type: anomalyType as AnomalyType, reason: anomalyReason.trim() })
                                    }
                                >
                                    {flag.isPending
                                        ? <Loader2 size={15} className="mr-2 animate-spin" />
                                        : <AlertTriangle size={15} className="mr-2" />}
                                    Submit Flag
                                </Button>
                            </div>
                        )}
                    </div>
                )}
            </SheetContent>
        </Sheet>
    )
}
