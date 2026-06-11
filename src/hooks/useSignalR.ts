import { useEffect } from 'react'
import { HubConnectionBuilder, LogLevel } from '@microsoft/signalr'
import { useQueryClient } from '@tanstack/react-query'
import { APP_CONFIG } from '@/config/app.config'
import { useLiveStore } from '@/store/liveStore'
import { useMapStore } from '@/store/mapStore'
import { getAuthToken } from '@/lib/api/authBridge'
import type { AnomalyAlert } from '@/types/hub'
import type { DeliveryStatus } from '@/types/delivery'

interface DriverPositionPayload {
    driverId: string
    lat: number
    lng: number
    districtId: string
}

interface DeliveryUpdatedPayload {
    deliveryId: string
    status: DeliveryStatus
    assignedDriverId?: string | null
    etaSeconds?: number | null
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
        // In mock mode the mock emitter handles position/delivery updates
        if (import.meta.env.VITE_USE_MOCK_SIGNALR !== 'false') return

        const connection = new HubConnectionBuilder()
            .withUrl(import.meta.env.VITE_HUB_URL ?? '', {
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
            )
        })

        connection.on('DeliveryUpdated', (payload: DeliveryUpdatedPayload) => {
            useLiveStore.getState().patchDelivery(payload.deliveryId, {
                status: payload.status,
                assignedDriverId: payload.assignedDriverId ?? null,
                etaSeconds: payload.etaSeconds ?? null,
            })
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

        let rttTimer: ReturnType<typeof setInterval> | null = null

        connection
            .start()
            .then(() => {
                useMapStore.getState().setHubStatus('connected')
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
            connection.stop()
        }
    }, [queryClient])
}
