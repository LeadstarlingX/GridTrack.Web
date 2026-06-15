// import type { DeliveryStatus } from './delivery'

export type AnomalyType = 'EtaExceeded' | 'RouteDeviation' | 'StalePosition' | 'UnexpectedStop'

export interface AnomalyAlert {
    id: string
    deliveryId: string
    driverId: string
    driverName: string
    anomalyType: AnomalyType
    reason: string
    districtId: string
    lat: number
    lng: number
    timestamp: string
}

export interface DemandSurge {
    districtId: string
    currentCount: number
    historicalMean: number
    deviations: number
    detectedAt: string
}

export interface AnomalyIncident {
    districtId: string
    anomalyCount: number
    windowMinutes: number
    summary: string
    detectedAt: string
}