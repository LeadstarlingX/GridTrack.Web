import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetDescription,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Loader2, Phone, Car, MapPin, Clock, Package, TrendingUp, Activity, AlertTriangle, Map } from 'lucide-react'
import { useDriverDetail } from '@/lib/api/queries/useDriverDetail'
import { useDriverStats } from '@/lib/api/queries/useDriverStats'
import { useDriverAvailability } from '@/lib/api/queries/useDriverAvailability'
import { useDistricts } from '@/lib/api/queries/useDistricts'
import { useNavigate } from 'react-router-dom'
import { useLiveStore } from '@/store/liveStore'
import { getMapRef } from '@/lib/mapRef'
import { APP_CONFIG } from '@/config/app.config'
import type { ReactNode } from 'react'

interface Props {
    driverId: string | null
    onClose: () => void
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
                <Icon size={13} className="text-[hsl(var(--foreground-muted))]" />
            </div>
            <div>
                <p className="text-xs text-[hsl(var(--foreground-muted))]">{label}</p>
                <p className="text-sm font-semibold tabular-nums text-[hsl(var(--foreground))]">{value}</p>
                {sub && (
                    <p className="text-[11px] text-[hsl(var(--foreground-subtle,var(--foreground-muted)))]">{sub}</p>
                )}
            </div>
        </div>
    )
}

function fmt(iso: string) {
    return new Date(iso).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}

function onTimeColor(pct: number) {
    return pct >= 80 ? 'text-green-400' : pct >= 60 ? 'text-amber-400' : 'text-red-400'
}

export default function DriverDetailDrawer({ driverId, onClose }: Props) {
    const navigate = useNavigate()
    const { data: driver, isLoading: driverLoading, isError: driverError } = useDriverDetail(driverId)
    const { data: stats, isLoading: statsLoading } = useDriverStats(driverId)
    const { data: districts = [] } = useDistricts()
    const { mutate: setAvailability, isPending: togglingAvailability } = useDriverAvailability()

    const districtName = districts.find((d) => d.id === driver?.districtId)?.name ?? driver?.districtId ?? '—'

    const statusVariant =
        driver?.isActive
            ? (stats?.activeDeliveries ?? 0) > 0 ? 'default' : 'secondary'
            : 'outline'
    const statusLabel = driver?.isActive
        ? (stats?.activeDeliveries ?? 0) > 0 ? 'In Transit' : 'Available'
        : 'Offline'

    return (
        <Sheet open={driverId !== null} onOpenChange={(o) => { if (!o) onClose() }}>
            <SheetContent side="right" className="flex w-full flex-col gap-0 p-0 sm:max-w-sm">

                {/* Header */}
                <SheetHeader className="border-b border-[hsl(var(--border))] px-6 py-5">
                    {driverLoading ? (
                        <div className="flex items-center gap-2 text-xs text-[hsl(var(--foreground-muted))]">
                            <Loader2 size={12} className="animate-spin" />
                            Loading driver…
                        </div>
                    ) : driverError || !driver ? (
                        <SheetTitle className="text-sm text-red-400">Failed to load driver.</SheetTitle>
                    ) : (
                        <>
                            <div className="flex items-start justify-between gap-3">
                                <div>
                                    <SheetTitle className="text-base leading-tight">{driver.name}</SheetTitle>
                                    {driver.shortName && driver.shortName !== driver.name && (
                                        <SheetDescription className="text-xs">{driver.shortName}</SheetDescription>
                                    )}
                                </div>
                                <Badge variant={statusVariant} className="shrink-0 mt-0.5">
                                    {statusLabel}
                                </Badge>
                            </div>

                            {/* Quick info row */}
                            <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-[hsl(var(--foreground-muted))]">
                                <span className="flex items-center gap-1" dir="rtl">
                                    <MapPin size={11} className="shrink-0" />
                                    {districtName}
                                </span>
                                {driver.phoneNumber && (
                                    <span className="flex items-center gap-1">
                                        <Phone size={11} className="shrink-0" />
                                        {driver.phoneNumber}
                                    </span>
                                )}
                                {driver.licensePlate && (
                                    <span className="flex items-center gap-1 font-mono">
                                        <Car size={11} className="shrink-0" />
                                        {driver.licensePlate}
                                        {driver.carType && <span className="font-sans ml-1">· {driver.carType}</span>}
                                    </span>
                                )}
                                <span className="flex items-center gap-1">
                                    <Clock size={11} className="shrink-0" />
                                    Last seen {fmt(driver.lastSeen)}
                                </span>
                            </div>
                        </>
                    )}
                </SheetHeader>

                {/* Body */}
                {driver && (
                    <div className="flex flex-1 flex-col gap-6 overflow-y-auto px-6 py-5">

                        {/* Stats */}
                        <div>
                            <p className="mb-4 text-[11px] font-semibold uppercase tracking-widest text-[hsl(var(--foreground-muted))]">
                                Performance
                            </p>
                            {statsLoading ? (
                                <div className="flex items-center gap-2 text-xs text-[hsl(var(--foreground-muted))]">
                                    <Loader2 size={12} className="animate-spin" />
                                    Loading stats…
                                </div>
                            ) : stats ? (
                                <div className="grid grid-cols-2 gap-x-6 gap-y-5">
                                    <Stat
                                        icon={TrendingUp}
                                        label="On-time rate"
                                        value={
                                            <span className={onTimeColor(stats.onTimeRatePct)}>
                                                {stats.onTimeRatePct.toFixed(1)}%
                                            </span>
                                        }
                                    />
                                    <Stat
                                        icon={Package}
                                        label="Completed"
                                        value={stats.totalCompleted}
                                        sub={`${stats.completedToday} today`}
                                    />
                                    <Stat
                                        icon={Activity}
                                        label="Active now"
                                        value={stats.activeDeliveries}
                                    />
                                    <Stat
                                        icon={AlertTriangle}
                                        label="Cancelled"
                                        value={stats.totalCancelled}
                                    />
                                </div>
                            ) : (
                                <p className="text-xs text-red-400">Stats unavailable.</p>
                            )}
                        </div>

                        {/* Actions */}
                        <div className="border-t border-[hsl(var(--border))] pt-5 flex flex-col gap-3">
                            <p className="text-[11px] font-semibold uppercase tracking-widest text-[hsl(var(--foreground-muted))]">
                                Actions
                            </p>

                            <Button
                                variant="outline"
                                size="sm"
                                className="w-full justify-start gap-2"
                                onClick={() => {
                                    const live = useLiveStore.getState().drivers[driver.id]
                                    const lat = live?.lat ?? driver.lat
                                    const lng = live?.lng ?? driver.lng
                                    getMapRef()?.flyTo({ center: [lng, lat], zoom: APP_CONFIG.map.focusZoom, duration: APP_CONFIG.map.flyToDurationMs })
                                    navigate('/', { state: { focusDriverId: driver.id, focusLat: lat, focusLng: lng } })
                                }}
                            >
                                <Map size={13} />
                                Show on live map
                            </Button>

                            <Button
                                variant="outline"
                                size="sm"
                                className="w-full justify-start gap-2"
                                disabled={togglingAvailability || (stats?.activeDeliveries ?? 0) > 0}
                                onClick={() =>
                                    setAvailability({
                                        id: driver.id,
                                        status: driver.isActive ? 'offline' : 'available',
                                    })
                                }
                            >
                                {driver.isActive ? 'Set Offline' : 'Set Available'}
                            </Button>
                        </div>
                    </div>
                )}
            </SheetContent>
        </Sheet>
    )
}
