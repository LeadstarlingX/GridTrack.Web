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
import { apiClient } from '@/lib/api/client'
import { APP_CONFIG } from '@/config/app.config'

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

export default function DriverPanel() {
    const driverId = useMapStore((s) => s.selectedDriverId)
    const setMode = useMapStore((s) => s.setSidePanelMode)
    const driver = useLiveStore((s) => s.drivers[driverId ?? ''])
    const activeDelivery = useLiveStore((s) =>
        Object.values(s.deliveries).find(
            (d) => d.assignedDriverId === (driverId ?? '') && d.status === 'InTransit',
        ) ?? null,
    )
    const { data: detail } = useDriverDetail(driverId)
    const { data: stats } = useDriverStats(driverId)
    const { data: allDistricts = [] } = useDistricts()
    const { data: deliveryDetail } = useDelivery(activeDelivery?.id ?? null)
    const [following, setFollowing] = useState(false)
    // ETA from the delivery detail (the live store's etaSeconds is often stale/0).
    const etaDisplay = useEtaCountdown(
        activeDelivery ? (deliveryDetail?.etaSeconds ?? activeDelivery.etaSeconds ?? null) : null,
    )

    if (!driver) return null

    const stallTimer = useStallTimer(driver.stalledSince ?? null)
    const statusColor = driver.status === 'in-transit' ? 'default' : driver.status === 'available' ? 'secondary' : 'outline'
    const districtName = allDistricts.find((d) => d.id === driver.districtId)?.name ?? driver.districtId

    const handleFollow = async () => {
        if (following) return
        setFollowing(true)
        try {
            if (activeDelivery) {
                try {
                    const resp = await apiClient.get<DeliveryDetailDto>(
                        APP_CONFIG.api.deliveryDetailPath.replace('{id}', activeDelivery.id),
                    )
                    const route: [number, number][] = (resp.data.routePolyline ?? []).map(
                        (p) => [p.lat, p.lng] as [number, number],
                    )
                    const eta = resp.data.etaSeconds ?? deliveryDetail?.etaSeconds ?? activeDelivery.etaSeconds ?? 420
                    useFocusStore.getState().enterFocusMode(activeDelivery.id, driver.id, route, eta)
                } catch {
                    const eta = deliveryDetail?.etaSeconds ?? activeDelivery.etaSeconds ?? 420
                    useFocusStore.getState().enterFocusMode(activeDelivery.id, driver.id, [], eta)
                }
            } else {
                useFocusStore.getState().enterFocusMode(`patrol-${driver.id}`, driver.id, [], 0)
            }
            setMode('focus')
        } finally {
            setFollowing(false)
        }
    }

    return (
        <div className="p-4">
            <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-lg">{driver.name}</h2>
                <Button variant="ghost" size="icon" onClick={() => setMode('idle')}>
                    <X className="h-4 w-4" />
                </Button>
            </div>
            {stallTimer && (
                <div className="mb-3 flex items-center gap-2 rounded-lg border border-orange-500/30 bg-orange-500/10 px-3 py-2">
                    <span className="inline-block h-2 w-2 rounded-full bg-orange-500 animate-pulse" />
                    <span className="text-xs font-semibold text-orange-500">Stalled · {stallTimer}</span>
                </div>
            )}
            <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                    <span className="text-muted-foreground">Status</span>
                    <Badge variant={statusColor}>{driver.status}</Badge>
                </div>
                <div className="flex justify-between">
                    <span className="text-muted-foreground">District</span>
                    <span className="capitalize">{districtName}</span>
                </div>
                <div className="flex justify-between">
                    <span className="text-muted-foreground">Position</span>
                    <span>{driver.lat.toFixed(4)}, {driver.lng.toFixed(4)}</span>
                </div>
                {activeDelivery && (
                    <div className="flex justify-between">
                        <span className="text-muted-foreground flex items-center gap-1"><Clock size={12} />ETA</span>
                        <span className="font-mono tabular-nums text-sky-500">{etaDisplay}</span>
                    </div>
                )}
                {activeDelivery && deliveryDetail?.routeCost != null && (
                    <div className="flex justify-between">
                        <span className="text-muted-foreground flex items-center gap-1"><Wallet size={12} />Expected cost</span>
                        <span className="font-mono tabular-nums text-amber-500">{deliveryDetail.routeCost.toFixed(0)} SYP</span>
                    </div>
                )}
                {detail?.licensePlate && (
                    <div className="flex justify-between">
                        <span className="text-muted-foreground flex items-center gap-1"><Car size={12} />Plate</span>
                        <span className="font-mono text-xs">{detail.licensePlate}{detail.carType ? ` · ${detail.carType}` : ''}</span>
                    </div>
                )}
                {detail?.phoneNumber && (
                    <div className="flex justify-between">
                        <span className="text-muted-foreground flex items-center gap-1"><Phone size={12} />Phone</span>
                        <span className="text-xs">{detail.phoneNumber}</span>
                    </div>
                )}
                {stats && (
                    <>
                        <div className="my-3 border-t border-[hsl(var(--border))]" />
                        <div className="grid grid-cols-3 gap-2 text-xs">
                            <div className="rounded-md bg-[hsl(var(--surface-raised,var(--surface)))] p-2 text-center">
                                <p className="text-[hsl(var(--foreground-muted))]">On-time</p>
                                <p className={`font-semibold tabular-nums ${stats.onTimeRatePct >= 80 ? 'text-green-400' : stats.onTimeRatePct >= 60 ? 'text-amber-400' : 'text-red-400'}`}>
                                    {stats.onTimeRatePct.toFixed(0)}%
                                </p>
                            </div>
                            <div className="rounded-md bg-[hsl(var(--surface-raised,var(--surface)))] p-2 text-center">
                                <p className="text-[hsl(var(--foreground-muted))]">Today</p>
                                <p className="font-semibold tabular-nums">{stats.completedToday}</p>
                            </div>
                            <div className="rounded-md bg-[hsl(var(--surface-raised,var(--surface)))] p-2 text-center">
                                <p className="text-[hsl(var(--foreground-muted))]">Active</p>
                                <p className="font-semibold tabular-nums">{stats.activeDeliveries}</p>
                            </div>
                        </div>
                    </>
                )}
                <Button className="w-full mt-4" onClick={handleFollow} disabled={following}>
                    {following ? <Loader2 size={14} className="animate-spin mr-1" /> : null}
                    Follow Driver
                </Button>
            </div>
        </div>
    )
}