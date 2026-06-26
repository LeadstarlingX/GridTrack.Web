export type DeliveryStatus = 'Created' | 'Assigned' | 'InTransit' | 'Delivered' | 'Anomalous' | 'Cancelled'

export interface DeliveryState {
    id: string
    status: DeliveryStatus
    assignedDriverId: string | null
    districtId: string
    etaSeconds: number | null
    createdAt: string
}