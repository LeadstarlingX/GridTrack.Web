import { useState, useEffect } from 'react'
import { Car, Clock, Loader2, Phone, Wallet, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useMapStore } from '@/store/mapStore'
import { useLiveStore } from '@/store/liveStore'
import { useFocusStore } from '@/store/focusStore'
import { useDriverDetail } from '@/lib/api/queries/useDriverDetail'
import { useDriverStats } from '@/lib/api/queries/useDriverStats'
import { useDistricts } from '@/lib/api/queries/useDistricts'
import { useDelivery } from '@/lib/api/queries/useDelivery'
import { useEtaCountdown } from '@/hooks/useEtaCountdown'
import { toEtaDeadline } from '@/lib/eta'
import { apiClient } from '@/lib/api/client'
import { APP_CONFIG } from '@/config/app.config'
import { cn } from '@/lib/utils'

import type { DeliveryDetailDto } from '@/types/api'

function useStallTimer(stalledSince: string | null) {
    const [elapsed, setElapsed] = useState(0)
    useEffect(() => {
        if (!stalledSince) { setElapsed(0); return }
        const tick = () => setElapsed(Math.floor((Date.now() - new Date(stalledSince).getTime()) / 1000))
        tick()
        const id = setInterval(tick, 1000)
        return () => clearInterval(id)
    }, [stalledSince])
    if (!stalledSince) return null
    const m = Math.floor(elapsed / 60), s = elapsed % 60
    return m > 0 ? `${m}m ${s}s` : `${s}s`
}

function DriverAvatar({ name, status }: { name: string; status: string }) {
    const initials = name
        .split(' ')
        .map((p) => p[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()

    const ringClass =
        status === 'in-transit'
            ? 'ring-[hsl(var(--primary))]'
            : status === 'available'
                ? 'ring-[hsl(var(--success))]'
                : 'ring-[hsl(var(--border-strong))]'

    return (
        <div className={cn(
            'w-10 h-10 rounded-full flex items-center justify-center shrink-0',
            'bg-[hsl(var(--primary)/0.12)] text-[hsl(var(--primary))]',
            'text-sm font-semibold ring-2',
            ringClass,
        )}>
            {initials}
        </div>
    )
}

export default function DriverPanel() {
    const driverId     = useMapStore((s) => s.selectedDriverId)
    const setMode      = useMapStore((s) => s.setSidePanelMode)
    const driver       = useLiveStore((s) => s.drivers[driverId ?? ''])
    const activeDelivery = useLiveStore((s) => {
        const candidates = Object.values(s.deliveries).filter(
            (d) =>
                d.assignedDriverId === (driverId ?? '') &&
                (d.status === 'InTransit' || d.status === 'PickedUp' || d.status === 'Assigned'),
        )
        return (
            candidates.sort(
                (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
            )[0] ?? null
        )
    })
    const { data: detail }         = useDriverDetail(driverId)
    const { data: stats }          = useDriverStats(driverId)
    const { data: allDistricts = [] } = useDistricts()
    const { data: deliveryDetail } = useDelivery(activeDelivery?.id ?? null)
    const [following, setFollowing] = useState(false)

    const [etaDeadlineFromRest, setEtaDeadlineFromRest] = useState<string | null>(
        () => toEtaDeadline(deliveryDetail?.etaSeconds),
    )
    const activeDeliveryId = activeDelivery?.id ?? null
    useEffect(() => { setEtaDeadlineFromRest(null) }, [activeDeliveryId])
    useEffect(() => {
        const d = toEtaDeadline(deliveryDetail?.etaSeconds)
        if (d !== null) setEtaDeadlineFromRest(d)
    }, [deliveryDetail?.etaSeconds])

    const etaDisplay    = useEtaCountdown(activeDelivery?.etaDeadline ?? etaDeadlineFromRest)
    const stallTimer    = useStallTimer(driver?.stalledSince ?? null)

    if (!driver) return null

    const statusVariant = driver.status === 'in-transit' ? 'default' : driver.status === 'available' ? 'secondary' : 'outline'
    const districtName  = allDistricts.find((d) => d.id === driver.districtId)?.name ?? driver.districtId

    const handleFollow = async () => {
        if (following) return
        setFollowing(true)
        try {
            if (activeDelivery) {
                try {
                    const resp = await apiClient.get<DeliveryDetailDto>(
                        APP_CONFIG.api.deliveryDetailPath.replace('{id}', activeDelivery.id),
                    )
                    const storedRoute: [number, number][] = (resp.data.routePolyline ?? []).map(
                        (p) => [p.lat, p.lng] as [number, number],
                    )
                    const liveRoute = useLiveStore.getState().driverRoutes[driver.id] ?? []
                    const route = liveRoute.length >= 2 ? liveRoute : storedRoute
                    useFocusStore.getState().enterFocusMode(activeDelivery.id, driver.id, route)
                } catch {
                    useFocusStore.getState().enterFocusMode(activeDelivery.id, driver.id, [])
                }
            } else {
                useFocusStore.getState().enterFocusMode(`patrol-${driver.id}`, driver.id, [])
            }
            setMode('focus')
        } finally {
            setFollowing(false)
        }
    }

    return (
        <div className="p-4 animate-in slide-in-from-right duration-200">
            {/* Header */}
            <div className="flex items-center gap-3 mb-4">
                <DriverAvatar name={driver.name} status={driver.status} />
                <div className="flex-1 min-w-0">
                    <h2 className="font-semibold text-sm text-[hsl(var(--foreground))] truncate">{driver.name}</h2>
                    <div className="flex items-center gap-1.5 mt-0.5">
                        <Badge variant={statusVariant} className="text-[10px] py-0 px-1.5 h-4">
                            {driver.status}
                        </Badge>
                        <span className="text-[11px] text-[hsl(var(--foreground-muted))] truncate">{districtName}</span>
                    </div>
                </div>
                <Button variant="ghost" size="icon" className="shrink-0" onClick={() => setMode('idle')}>
                    <X className="h-4 w-4" />
                </Button>
            </div>

            {/* Stall alert */}
            {stallTimer && (
                <div className="mb-3 flex items-center gap-2 rounded-lg border border-orange-500/30 bg-orange-500/10 px-3 py-2">
                    <span className="inline-block h-2 w-2 rounded-full bg-orange-500 animate-pulse shrink-0" />
                    <span className="text-xs font-semibold text-orange-500">Stalled · {stallTimer}</span>
                </div>
            )}

            {/* Stats grid */}
            {stats && (
                <div className="grid grid-cols-3 gap-2 mb-4">
                    <div className="rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--surface-raised))] p-2 text-center">
                        <p className="text-[10px] text-[hsl(var(--foreground-muted))] uppercase tracking-wide">On-time</p>
                        <p className={cn('text-sm font-bold tabular-nums mt-0.5', stats.onTimeRatePct >= 80 ? 'text-[hsl(var(--success))]' : stats.onTimeRatePct >= 60 ? 'text-[hsl(var(--warning))]' : 'text-[hsl(var(--destructive))]')}>
                            {stats.onTimeRatePct.toFixed(0)}%
                        </p>
                    </div>
                    <div className="rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--surface-raised))] p-2 text-center">
                        <p className="text-[10px] text-[hsl(var(--foreground-muted))] uppercase tracking-wide">Today</p>
                        <p className="text-sm font-bold tabular-nums mt-0.5 text-[hsl(var(--foreground))]">{stats.completedToday}</p>
                    </div>
                    <div className="rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--surface-raised))] p-2 text-center">
                        <p className="text-[10px] text-[hsl(var(--foreground-muted))] uppercase tracking-wide">Active</p>
                        <p className="text-sm font-bold tabular-nums mt-0.5 text-[hsl(var(--foreground))]">{stats.activeDeliveries}</p>
                    </div>
                </div>
            )}

            {/* Details rows */}
            <div className="space-y-2.5 text-sm">
                <div className="flex justify-between items-center">
                    <span className="text-[hsl(var(--foreground-muted))] flex items-center gap-1.5 text-xs">
                        Position
                    </span>
                    <span className="font-mono text-xs text-[hsl(var(--foreground))]">
                        {driver.lat.toFixed(4)}, {driver.lng.toFixed(4)}
                    </span>
                </div>

                {activeDelivery && etaDisplay !== '--:--' && (
                    <div className="flex justify-between items-center">
                        <span className="text-[hsl(var(--foreground-muted))] flex items-center gap-1.5 text-xs">
                            <Clock size={12} />ETA
                        </span>
                        <span className="font-mono tabular-nums text-sky-500 font-semibold">{etaDisplay}</span>
                    </div>
                )}

                {activeDelivery && deliveryDetail?.routeCost != null && (
                    <div className="flex justify-between items-center">
                        <span className="text-[hsl(var(--foreground-muted))] flex items-center gap-1.5 text-xs">
                            <Wallet size={12} />Expected cost
                        </span>
                        <span className="font-mono tabular-nums text-[hsl(var(--warning))] font-semibold">
                            {deliveryDetail.routeCost.toFixed(0)} SYP
                        </span>
                    </div>
                )}

                {detail?.licensePlate && (
                    <div className="flex justify-between items-center">
                        <span className="text-[hsl(var(--foreground-muted))] flex items-center gap-1.5 text-xs">
                            <Car size={12} />Plate
                        </span>
                        <span className="font-mono text-xs text-[hsl(var(--foreground))]">
                            {detail.licensePlate}{detail.carType ? ` · ${detail.carType}` : ''}
                        </span>
                    </div>
                )}

                {detail?.phoneNumber && (
                    <div className="flex justify-between items-center">
                        <span className="text-[hsl(var(--foreground-muted))] flex items-center gap-1.5 text-xs">
                            <Phone size={12} />Phone
                        </span>
                        <span className="text-xs text-[hsl(var(--foreground))]">{detail.phoneNumber}</span>
                    </div>
                )}
            </div>

            {/* Active delivery card */}
            {activeDelivery && (
                <div className="mt-4 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--surface-raised))] backdrop-blur-sm px-3 py-2.5">
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-[hsl(var(--foreground-muted))] mb-1">
                        Active Delivery
                    </p>
                    <p className="text-xs font-mono text-[hsl(var(--foreground))] truncate">{activeDelivery.id}</p>
                </div>
            )}

            <Button
                className="w-full mt-4"
                onClick={handleFollow}
                disabled={following}
            >
                {following ? <Loader2 size={14} className="animate-spin mr-2" /> : null}
                Follow Driver
            </Button>
        </div>
    )
}
