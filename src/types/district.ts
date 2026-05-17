export interface DistrictStats {
    id: string
    name: string
    center: [number, number]
    activeDeliveries: number
    completedToday: number
    anomalyRate: number
}