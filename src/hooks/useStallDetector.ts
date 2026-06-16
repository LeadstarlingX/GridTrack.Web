import { useEffect, useRef } from 'react'
import { useLiveStore } from '@/store/liveStore'

const STALL_THRESHOLD_MS = 5 * 60 * 1000 // 5 minutes of no position change
const CHECK_INTERVAL_MS  = 15_000         // scan every 15 seconds

export function useStallDetector() {
    // tracks the last time each driver's position changed
    const snapshots = useRef<Record<string, { lat: number; lng: number; since: number }>>({})

    useEffect(() => {
        const tick = () => {
            const { drivers, deliveries } = useLiveStore.getState()
            const now = Date.now()

            // build set of driver ids currently carrying an InTransit delivery
            const onDelivery = new Set(
                Object.values(deliveries)
                    .filter((d) => d.status === 'InTransit' && d.assignedDriverId != null)
                    .map((d) => d.assignedDriverId!),
            )

            for (const [id, driver] of Object.entries(drivers)) {
                const snap = snapshots.current[id]
                const moved = !snap || snap.lat !== driver.lat || snap.lng !== driver.lng

                if (moved) {
                    snapshots.current[id] = { lat: driver.lat, lng: driver.lng, since: now }
                    continue
                }

                if (!onDelivery.has(id)) continue         // not on a delivery — skip
                if (driver.stalledSince !== null) continue // already flagged

                if (snap && now - snap.since >= STALL_THRESHOLD_MS) {
                    useLiveStore.getState().markStall(id, new Date(snap.since).toISOString())
                }
            }
        }

        const interval = setInterval(tick, CHECK_INTERVAL_MS)
        return () => clearInterval(interval)
    }, [])
}
