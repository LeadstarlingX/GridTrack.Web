import { useEffect, useRef } from 'react'
import { toast } from '@/components/ui'
import { useLiveStore } from '@/store/liveStore'
import { useToastSettings } from '@/hooks/useToastSettings'
import { getMapRef } from '@/lib/mapRef'
import { useMapStore } from '@/store/mapStore'

export function useAnomalyToasts() {
    const { toastsEnabled } = useToastSettings()
    const anomalyQueue = useLiveStore((s) => s.anomalyQueue)
    const lastSeenId = useRef<string | null>(null)

    useEffect(() => {
        if (!toastsEnabled || anomalyQueue.length === 0) return
        const latest = anomalyQueue[0]
        if (!latest || latest.id === lastSeenId.current) return
        lastSeenId.current = latest.id

        const timestamp = new Date(latest.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        toast.error(`Anomaly detected in ${latest.districtId}`, {
            description: `${latest.reason} · ${timestamp}`,
            duration: 8000,
            action: {
                label: 'View',
                onClick: () => {
                    const map = getMapRef()
                    map?.flyTo([latest.lat, latest.lng], 15)
                    const mapState = useMapStore.getState()
                    mapState.selectDriver(latest.driverId)
                    mapState.setSidePanelMode('driver')
                },
            },
        })
    }, [anomalyQueue, toastsEnabled])
}
