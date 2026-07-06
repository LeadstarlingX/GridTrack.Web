import { useEffect } from 'react'
import { HubConnectionBuilder, HttpTransportType, LogLevel } from '@microsoft/signalr'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { APP_CONFIG } from '@/config/app.config'
import { useLiveStore } from '@/store/liveStore'
import { useMapStore } from '@/store/mapStore'
import { getAuthToken } from '@/lib/api/authBridge'
import { apiClient } from '@/lib/api/client'
import { setHubConnection } from '@/lib/hubConnection'
import { toEtaDeadline } from '@/lib/eta'
import type { AnomalyAlert, DemandSurge, AnomalyIncident } from '@/types/hub'
import type { DeliveryStatus } from '@/types/delivery'
import type { DriverListItemDto, PagedResponse } from '@/types/api'

interface DriverPositionPayload {
    driverId: string
    lat: number
    lng: number
    districtId: string
    deliveryId?: string | null
    routeAhead?: [number, number][] | null
}

interface DeliveryUpdatedPayload {
    deliveryId: string
    status: DeliveryStatus
    assignedDriverId?: string | null
    etaSeconds?: number | null
    routeDistanceMeters?: number | null
    routeDurationSeconds?: number | null
    routeCost?: number | null
}

interface AnomalyBroadcastPayload extends Omit<AnomalyAlert, 'id'> {}

interface ForecastOverlayUpdatedPayload {
    districtId: string
    forecastedDemand: number
    updatedAt: string
}

export function useSignalR() {
    const queryClient = useQueryClient()

    useEffect(() => {
        const connection = new HubConnectionBuilder()
            .withUrl(import.meta.env.VITE_HUB_URL ?? '', {
                skipNegotiation: true,
                transport: HttpTransportType.WebSockets,
                accessTokenFactory: () => getAuthToken().then((t) => t ?? ''),
            })
            .withAutomaticReconnect({
                nextRetryDelayInMilliseconds: (ctx) => {
                    const delays = APP_CONFIG.signalr.reconnectDelaysMs
                    return delays[Math.min(ctx.previousRetryCount, delays.length - 1)]
                },
            })
            .configureLogging(LogLevel.Warning)
            .build()

        connection.onreconnecting(() => useMapStore.getState().setHubStatus('reconnecting'))
        connection.onclose(() => { useMapStore.getState().setHubStatus('disconnected'); useMapStore.getState().setHubRtt(null) })

        connection.on('DriverPositionUpdated', (payload: DriverPositionPayload) => {
            useLiveStore.getState().updateDriverPosition(
                payload.driverId,
                payload.lat,
                payload.lng,
                payload.districtId,
                payload.routeAhead ?? undefined,
            )
        })

        connection.on('DriverPositionBatch', (positions: DriverPositionPayload[]) => {
            performance.mark('gt-signalr-recv')
            useLiveStore.getState().batchUpdateDriverPositions(
                positions.map((p) => ({
                    id: p.driverId,
                    lat: p.lat,
                    lng: p.lng,
                    districtId: p.districtId,
                    deliveryId: p.deliveryId ?? null,
                    routeAhead: p.routeAhead,
                }))
            )
            performance.measure('gt:signalr→store', 'gt-signalr-recv')
        })

        connection.on('DeliveryUpdated', (payload: DeliveryUpdatedPayload) => {
            const store = useLiveStore.getState()
            const prev = store.deliveries[payload.deliveryId]

            const newEtaDeadline = toEtaDeadline(payload.etaSeconds)
            store.patchDelivery(payload.deliveryId, {
                status: payload.status,
                assignedDriverId: payload.assignedDriverId ?? null,
                // Only advance the deadline when the backend sends a real value.
                // A null etaSeconds on a location tick must not erase a valid deadline.
                ...(newEtaDeadline !== null ? { etaDeadline: newEtaDeadline } : {}),
                routeDistanceMeters: payload.routeDistanceMeters ?? null,
                routeDurationSeconds: payload.routeDurationSeconds ?? null,
                routeCost: payload.routeCost ?? null,
            })

            const statusChanged = prev?.status !== payload.status
            const routeArrived = payload.routeCost != null && prev?.routeCost == null
            if (statusChanged || routeArrived) {
                queryClient.invalidateQueries({ queryKey: ['delivery', payload.deliveryId] })
            }
        })

        connection.on('AnomalyBroadcast', (payload: AnomalyBroadcastPayload) => {
            const alert: AnomalyAlert = {
                id: `anom-${payload.timestamp}-${payload.driverId}`,
                ...payload,
            }
            useLiveStore.getState().pushAnomaly(alert)
        })

        connection.on('ForecastOverlayUpdated', (payload: ForecastOverlayUpdatedPayload) => {
            queryClient.invalidateQueries({ queryKey: ['forecast', payload.districtId] })
        })

        connection.on('StallDetected', (payload: { driverId: string; driverName: string; districtId: string; stalledSince: string }) => {
            useLiveStore.getState().markStall(payload.driverId, payload.stalledSince)
        })

        connection.on('DemandSurge', (payload: DemandSurge) => {
            useLiveStore.getState().pushSurge(payload)
            toast.warning(`Demand surge · ${payload.districtId}`, {
                description: `${payload.deviations.toFixed(1)}σ above baseline (${payload.currentCount} vs ${payload.historicalMean.toFixed(1)} avg)`,
                duration: APP_CONFIG.toast.anomalyDurationMs,
            })
        })

        connection.on('AnomalyIncident', (payload: AnomalyIncident) => {
            useLiveStore.getState().pushIncident(payload)
        })

        let rttTimer: ReturnType<typeof setInterval> | null = null

        const hydrateDrivers = async () => {
            try {
                const res = await apiClient.get<PagedResponse<DriverListItemDto>>(
                    APP_CONFIG.api.driversPath,
                    { params: { pageSize: 200 } },
                )
                const drivers = res.data.items.map((d) => ({
                    id: d.id,
                    name: d.name,
                    lat: d.lat,
                    lng: d.lng,
                    districtId: d.districtId,
                    status: d.status,
                    routeIndex: 0,
                    pointIndex: 0,
                    stalledSince: null as string | null,
                }))
                if (drivers.length > 0) useLiveStore.getState().initDrivers(drivers)
            } catch {
                // Non-fatal — store stays empty and fills from position updates
            }
        }

        connection
            .start()
            .then(() => {
                setHubConnection(connection)
                useMapStore.getState().setHubStatus('connected')
                void hydrateDrivers()
                // Measure RTT every 5s while connected
                const measureRtt = async () => {
                    try {
                        const sent = Date.now()
                        await connection.invoke<number>('Ping', sent)
                        useMapStore.getState().setHubRtt(Date.now() - sent)
                    } catch {
                        useMapStore.getState().setHubRtt(null)
                    }
                }
                measureRtt()
                rttTimer = setInterval(measureRtt, 5_000)
            })
            .catch(() => useMapStore.getState().setHubStatus('disconnected'))

        connection.onreconnected(() => {
            useMapStore.getState().setHubStatus('connected')
            if (!rttTimer) rttTimer = setInterval(async () => {
                try {
                    const sent = Date.now()
                    await connection.invoke<number>('Ping', sent)
                    useMapStore.getState().setHubRtt(Date.now() - sent)
                } catch {
                    useMapStore.getState().setHubRtt(null)
                }
            }, 5_000)
        })

        return () => {
            if (rttTimer) clearInterval(rttTimer)
            setHubConnection(null)
            connection.stop()
        }
    }, [queryClient])
}
