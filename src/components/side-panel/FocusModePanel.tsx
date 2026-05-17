import { X, Lock, Unlock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useFocusStore } from '@/store/focusStore'
import { useMapStore } from '@/store/mapStore'
import { useLiveStore } from '@/store/liveStore'
import { useEtaCountdown } from '@/hooks/useEtaCountdown'

export default function FocusModePanel() {
    const focusedDeliveryId = useFocusStore((s) => s.focusedDeliveryId)
    const focusedDriverId = useFocusStore((s) => s.focusedDriverId)
    const autoFollow = useFocusStore((s) => s.autoFollow)
    const etaSeconds = useFocusStore((s) => s.etaSeconds)
    const toggleAutoFollow = useFocusStore((s) => s.toggleAutoFollow)
    const exitFocus = useFocusStore((s) => s.exitFocusMode)
    const setMode = useMapStore((s) => s.setSidePanelMode)

    const driver = useLiveStore((s) => s.drivers[focusedDriverId ?? ''])
    const eta = useEtaCountdown(etaSeconds)

    const handleExit = () => {
        exitFocus()
        setMode('idle')
    }

    if (!focusedDeliveryId || !driver) return null

    return (
        <div className="p-4">
            <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-lg">Focus Mode</h2>
                <Button variant="ghost" size="icon" onClick={handleExit}>
                    <X className="h-4 w-4" />
                </Button>
            </div>
            <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                    <span className="text-gray-400">Order</span>
                    <Badge>{focusedDeliveryId}</Badge>
                </div>
                <div className="flex justify-between">
                    <span className="text-gray-400">Driver</span>
                    <span>{driver.name}</span>
                </div>
                <div className="flex justify-between items-center">
                    <span className="text-gray-400">ETA</span>
                    <span className="text-xl font-bold text-amber-500">{eta}</span>
                </div>
                <Button
                    variant={autoFollow ? 'default' : 'outline'}
                    className="w-full mt-4"
                    onClick={toggleAutoFollow}
                >
                    {autoFollow ? <Lock className="h-4 w-4 mr-2" /> : <Unlock className="h-4 w-4 mr-2" />}
                    {autoFollow ? 'Camera Locked' : 'Lock Camera'}
                </Button>
            </div>
        </div>
    )
}