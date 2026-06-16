import { useEffect } from 'react'
import { apiClient } from '@/lib/api/client'
import { useLiveStore } from '@/store/liveStore'
import type { DriverState } from '@/types/driver'
import type { DeliveryState, DeliveryStatus } from '@/types/delivery'

// Shapes returned by the REST API (camelCase from ASP.NET Core controller defaults)
interface DriverListItem {
    id: string
    name: string
    shortName: string
    lat: number
    lng: number
    districtId: string
    status: string       // "available" | "in-transit" | "offline"
    activeDeliveries: number
    completedToday: number
    hasAnomaly: boolean
    anomalyReason?: string | null
}

interface DeliveryListItem {
    id: string
    status: string
    districtId: string
    assignedDriverId?: string | null
    assignedDriverName?: string | null
    etaSeconds?: number | null
    createdAt: string
}

interface PagedResponse<T> {
    items: T[]
    nextCursor?: string | null
    totalCount?: number | null
}

// Hydrates liveStore from REST on mount; SignalR deltas take over after.
export function useRealLiveState() {
    useEffect(() => {
        let cancelled = false

        async function load() {
            try {
                const [driversRes, deliveriesRes] = await Promise.all([
                    apiClient.get<PagedResponse<DriverListItem>>('/api/drivers?pageSize=100'),
                    apiClient.get<PagedResponse<DeliveryListItem>>('/api/deliveries?pageSize=100'),
                ])

                if (cancelled) return

                const drivers: Record<string, DriverState> = {}
                for (const d of driversRes.data.items) {
                    drivers[d.id] = {
                        id: d.id,
                        name: d.name,
                        lat: d.lat,
                        lng: d.lng,
                        districtId: d.districtId,
                        status: normalizeDriverStatus(d.status),
                        routeIndex: 0,
                        pointIndex: 0,
                        stalledSince: null,
                    }
                }

                const deliveries: Record<string, DeliveryState> = {}
                for (const d of deliveriesRes.data.items) {
                    deliveries[d.id] = {
                        id: d.id,
                        status: d.status as DeliveryStatus,
                        assignedDriverId: d.assignedDriverId ?? null,
                        districtId: d.districtId,
                        etaSeconds: d.etaSeconds ?? null,
                        createdAt: d.createdAt,
                    }
                }

                useLiveStore.setState({ drivers, deliveries })
            } catch {
                // Non-fatal — SignalR updates will still arrive as the backend pushes them
            }
        }

        load()
        return () => { cancelled = true }
    }, [])
}

function normalizeDriverStatus(raw: string): DriverState['status'] {
    const s = raw.toLowerCase()
    if (s === 'available' || s === 'stalled') return 'available'
    if (s === 'in-transit' || s === 'intransit') return 'in-transit'
    return 'offline'
}
