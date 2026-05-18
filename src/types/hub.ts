// import type { DeliveryStatus } from './delivery'

export type AnomalyType = 'Stall' | 'RouteDeviation' | 'Delay'

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