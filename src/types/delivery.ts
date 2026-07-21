export type DeliveryStatus = 'Created' | 'Assigned' | 'InTransit' | 'Delivered' | 'Anomalous' | 'PickedUp'

export interface DeliveryState {
    id: string
    status: DeliveryStatus
    assignedDriverId: string | null
    districtId: string
    /** Absolute ISO timestamp when this delivery is expected to arrive. */
    etaDeadline: string | null
    createdAt: string
    routeDistanceMeters: number | null
    routeDurationSeconds: number | null
    routeCost: number | null
    urgencyScore: number | null
    urgencyNote: string | null
}