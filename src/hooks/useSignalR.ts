import { useEffect } from 'react'
import { HubConnectionBuilder, LogLevel } from '@microsoft/signalr'
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
    useEffect(() => {
        // In mock mode the mock emitter handles position/delivery updates
        if (import.meta.env.VITE_USE_MOCK_SIGNALR === 'true') return

        const connection = new HubConnectionBuilder()
            .withUrl(import.meta.env.VITE_HUB_URL ?? '', {
                accessTokenFactory: () => getAuthToken().then((t) => t ?? ''),
            })
            .withAutomaticReconnect(APP_CONFIG.signalr.reconnectDelaysMs as number[])
            .configureLogging(LogLevel.Warning)
            .build()

        connection.onreconnecting(() => {
            useMapStore.getState().setHubStatus('reconnecting')
        })

        connection.onreconnected(() => {
            useMapStore.getState().setHubStatus('connected')
        })

        connection.onclose(() => {
            useMapStore.getState().setHubStatus('disconnected')
        })

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

        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        connection.on('ForecastOverlayUpdated', (_payload: ForecastOverlayUpdatedPayload) => {
            // TODO: wire to recommendation store when forecast overlay connects to real API
        })

        connection
            .start()
            .then(() => useMapStore.getState().setHubStatus('connected'))
            .catch(() => useMapStore.getState().setHubStatus('disconnected'))

        return () => {
            connection.stop()
        }
    }, [])
}
