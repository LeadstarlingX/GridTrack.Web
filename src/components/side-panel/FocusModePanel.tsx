import { X, Lock, Unlock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useFocusStore } from '@/store/focusStore'
import { useMapStore } from '@/store/mapStore'
import { useLiveStore } from '@/store/liveStore'
import { useEtaCountdown } from '@/hooks/useEtaCountdown'

export default function FocusModePanel() {
    const focusedDeliveryId = useFocusStore((s) => s.focusedDeliveryId)
    const focusedDriverId   = useFocusStore((s) => s.focusedDriverId)
    const autoFollow        = useFocusStore((s) => s.autoFollow)
    const toggleAutoFollow  = useFocusStore((s) => s.toggleAutoFollow)
    const exitFocus         = useFocusStore((s) => s.exitFocusMode)
    const setMode           = useMapStore((s) => s.setSidePanelMode)

    const driver      = useLiveStore((s) => s.drivers[focusedDriverId ?? ''])
    const etaDeadline = useLiveStore((s) => s.deliveries[focusedDeliveryId ?? '']?.etaDeadline ?? null)
    const eta         = useEtaCountdown(etaDeadline)

    const handleExit = () => {
        exitFocus()
        setMode('idle')
    }

    if (!focusedDeliveryId || !driver) return null

    return (
        <div className="p-4 animate-in slide-in-from-right duration-200">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div>
                    <h2 className="text-sm font-semibold text-[hsl(var(--foreground))]">Focus Mode</h2>
                    <p className="text-[11px] text-[hsl(var(--foreground-muted))]">Tracking live position</p>
                </div>
                <Button variant="ghost" size="icon" onClick={handleExit}>
                    <X className="h-4 w-4" />
                </Button>
            </div>

            {/* ETA — prominent */}
            <div className="rounded-lg border border-[hsl(var(--warning)/0.3)] bg-[hsl(var(--warning)/0.08)] px-4 py-3 mb-4 text-center">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-[hsl(var(--warning))] mb-1">ETA</p>
                <p className="text-3xl font-bold tabular-nums text-[hsl(var(--warning))]">{eta}</p>
            </div>

            {/* Info rows */}
            <div className="space-y-2.5 text-sm">
                <div className="flex items-center justify-between">
                    <span className="text-xs text-[hsl(var(--foreground-muted))]">Order</span>
                    <Badge variant="outline" className="font-mono text-[10px]">{focusedDeliveryId.slice(0, 8)}…</Badge>
                </div>
                <div className="flex items-center justify-between">
                    <span className="text-xs text-[hsl(var(--foreground-muted))]">Driver</span>
                    <span className="text-sm font-medium text-[hsl(var(--foreground))]">{driver.name}</span>
                </div>
            </div>

            <Button
                variant={autoFollow ? 'default' : 'outline'}
                className="w-full mt-5"
                onClick={toggleAutoFollow}
            >
                {autoFollow ? <Lock className="h-4 w-4 mr-2" /> : <Unlock className="h-4 w-4 mr-2" />}
                {autoFollow ? 'Camera Locked' : 'Lock Camera'}
            </Button>
        </div>
    )
}
