export interface DriverState {
    id: string
    name: string
    lat: number
    lng: number
    districtId: string
    status: 'available' | 'in-transit' | 'offline'
    routeIndex: number
    pointIndex: number
}