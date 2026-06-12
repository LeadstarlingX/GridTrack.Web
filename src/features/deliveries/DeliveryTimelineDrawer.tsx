import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetDescription,
} from '@/components/ui/sheet'
import { useDeliveryTimeline } from '@/lib/api/queries/useDeliveryTimeline'
import type { DeliveryTimelineEventDto } from '@/types/api'
import {
    PackagePlus,
    UserCheck,
    Package,
    Truck,
    PackageCheck,
    XCircle,
    AlertTriangle,
    Loader2,
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

const EVENT_META: Record<EventType, { icon: React.ElementType; color: string; dot: string }> = {
    Created:       { icon: PackagePlus,   color: 'text-blue-400',   dot: 'bg-blue-400' },
    Assigned:      { icon: UserCheck,     color: 'text-violet-400', dot: 'bg-violet-400' },
    PickedUp:      { icon: Package,       color: 'text-amber-400',  dot: 'bg-amber-400' },
    InTransit:     { icon: Truck,         color: 'text-sky-400',    dot: 'bg-sky-400' },
    Delivered:     { icon: PackageCheck,  color: 'text-green-400',  dot: 'bg-green-400' },
    Cancelled:     { icon: XCircle,       color: 'text-red-400',    dot: 'bg-red-400' },
    AnomalyFlagged:{ icon: AlertTriangle, color: 'text-orange-400', dot: 'bg-orange-400' },
}

function TimelineEvent({ event, isLast }: { event: DeliveryTimelineEventDto; isLast: boolean }) {
    const meta = EVENT_META[event.type]
    const Icon = meta.icon
    const time = fmt(event.at)

    return (
        <div className="relative flex gap-4">
            {/* Vertical connector line */}
            {!isLast && (
                <div className="absolute left-[18px] top-8 bottom-0 w-px bg-[hsl(var(--border))]" />
            )}

            {/* Icon dot */}
            <div className={`relative z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[hsl(var(--border))] bg-[hsl(var(--surface))]`}>
                <Icon size={16} className={meta.color} />
            </div>

            {/* Content */}
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

export default function DeliveryTimelineDrawer({ deliveryId, onClose }: Props) {
    const { data, isLoading, isError } = useDeliveryTimeline(deliveryId)

    return (
        <Sheet open={deliveryId !== null} onOpenChange={(open) => { if (!open) onClose() }}>
            <SheetContent side="right" className="w-full sm:max-w-md flex flex-col gap-0 p-0">
                <SheetHeader className="border-b border-[hsl(var(--border))] px-6 py-5">
                    <SheetTitle>Delivery Timeline</SheetTitle>
                    <SheetDescription className="font-mono text-xs truncate">
                        {deliveryId ?? '—'}
                    </SheetDescription>
                </SheetHeader>

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

                    {data && data.events.length === 0 && (
                        <p className="text-sm text-[hsl(var(--foreground-muted))]">No events yet.</p>
                    )}

                    {data && data.events.length > 0 && (
                        <div>
                            {data.events.map((event, i) => (
                                <TimelineEvent
                                    key={`${event.type}-${i}`}
                                    event={event}
                                    isLast={i === data.events.length - 1}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </SheetContent>
        </Sheet>
    )
}
