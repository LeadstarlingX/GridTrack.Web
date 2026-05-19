export interface ApiError {
    code: string
    message: string
    traceId?: string
}

export interface PagedResponse<T> {
    items: T[]
    nextCursor: string | null
    totalCount?: number
}

// GET /api/districts
export interface DistrictDto {
    id: string
    name: string
    centroid: {
        lat: number
        lng: number
    }
}

// GET /api/districts/boundaries
export interface DistrictBoundaryProperties {
    districtId: string
    name: string
}

// GET /api/deliveries
export interface DeliveryListItemDto {
    id: string
    status: 'Created' | 'Assigned' | 'InTransit' | 'Delivered' | 'Anomalous'
    districtId: string
    assignedDriverId: string | null
    assignedDriverName: string | null
    etaSeconds: number | null
    createdAt: string
}

// GET /api/deliveries/{id}
export interface DeliveryDetailDto extends DeliveryListItemDto {
    routePolyline: [number, number][]
    updatedAt: string
}

export interface DeliveriesQueryParams {
    cursor?: string
    status?: DeliveryListItemDto['status']
    districtId?: string
    from?: string
    to?: string
    pageSize?: number
}

// GET /api/drivers
export interface DriverListItemDto {
    id: string
    name: string
    status: 'available' | 'in-transit' | 'offline'
    districtId: string
    districtName: string
    lat: number
    lng: number
}

// PATCH /api/drivers/{id}/availability
export interface DriverAvailabilityRequest {
    status: 'available' | 'offline'
}

export interface DriverAvailabilityResponse {
    id: string
    status: 'available' | 'offline'
    updatedAt: string
}

export interface DriversQueryParams {
    cursor?: string
    districtId?: string
    status?: DriverListItemDto['status']
    pageSize?: number
}

// GET /api/alerts
export interface AnomalyAlertDto {
    id: string
    deliveryId: string
    driverId: string
    driverName: string
    anomalyType: 'Stall' | 'RouteDeviation' | 'Delay'
    reason: string
    districtId: string
    districtName: string
    lat: number
    lng: number
    timestamp: string
}

export interface AlertsQueryParams {
    cursor?: string
    from?: string
    to?: string
    districtId?: string
    anomalyType?: AnomalyAlertDto['anomalyType']
    pageSize?: number
}

// GET /api/analytics/summary
export interface AnalyticsSummaryDto {
    totalDeliveriesToday: number
    completionRate: number
    activeDrivers: number
    anomalyRate: number
    updatedAt: string
}

// GET /api/analytics/trends
export interface TimePointDto {
    bucket: string
    value: number
}

export interface AnalyticsTrendDto {
    deliveryTrend: TimePointDto[]
    anomalyTrend: TimePointDto[]
}

export interface TrendsQueryParams {
    from: string
    to: string
    granularity: 'hour' | 'day'
}

// GET /api/analytics/h3-density
export interface H3CellDto {
    h3Index: string
    lat: number
    lng: number
    deliveryCount: number
}

export interface H3DensityDto {
    cells: H3CellDto[]
}

export interface H3DensityQueryParams {
    from: string
    to: string
    resolution: number
    fromHour?: number
    toHour?: number
}

// POST /api/export/csv
export interface CsvExportRequest {
    mode: 'range' | 'full'
    from: string
    to: string
    days: string[]
    fromHour: number
    toHour: number
}

// POST /api/analysis/chat
export interface ChatRequest {
    messages: Array<{ role: 'user' | 'assistant'; content: string }>
    csvData: string
}

export interface ChatResponse {
    reply: string
}

// GET /api/forecast/{districtId}
export interface ForecastDto {
    districtId: string
    forecastedDemand: number
    horizon: string
    driverRecommendation: number
    staffingRatio: number
    updatedAt: string
}

export type ApiEndpoint =
    | '/api/districts'
    | '/api/districts/boundaries'
    | '/api/deliveries'
    | '/api/deliveries/{id}'
    | '/api/drivers'
    | '/api/drivers/{id}/availability'
    | '/api/alerts'
    | '/api/analytics/summary'
    | '/api/analytics/trends'
    | '/api/analytics/h3-density'
    | '/api/forecast/{districtId}'
    | '/api/export/csv'
    | '/api/analysis/chat'
