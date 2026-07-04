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

export type DeliveryStatus =
    | 'Created'
    | 'Assigned'
    | 'PickedUp'
    | 'InTransit'
    | 'Delivered'
    | 'Cancelled'
    | 'Anomalous'

export type AnomalyType = 'EtaExceeded' | 'RouteDeviation' | 'StalePosition' | 'UnexpectedStop'

// GET /api/deliveries
export interface DeliveryListItemDto {
    id: string
    status: DeliveryStatus
    districtId: string
    assignedDriverId: string | null
    assignedDriverName: string | null
    etaSeconds: number | null
    createdAt: string
}

// GET /api/deliveries/{id}
export interface DeliveryDetailDto extends DeliveryListItemDto {
    // API returns coordinate objects ({ lat, lng }), not [lng, lat] tuples.
    routePolyline: { lat: number; lng: number }[]
    updatedAt: string
    currentLat: number | null
    currentLng: number | null
    routeDistanceMeters: number | null
    routeDurationSeconds: number | null
    routeCost: number | null
}

export interface DeliveriesQueryParams {
    cursor?: string
    status?: DeliveryListItemDto['status']
    districtId?: string
    from?: string
    to?: string
    pageSize?: number
}

// GET /api/deliveries/{id}/timeline
export interface DeliveryTimelineEventDto {
    type: 'Created' | 'Assigned' | 'PickedUp' | 'InTransit' | 'Delivered' | 'Cancelled' | 'AnomalyFlagged'
    label: string
    at: string | null
    note: string | null
}

export interface DeliveryTimelineDto {
    deliveryId: string
    events: DeliveryTimelineEventDto[]
}

// GET /api/drivers/{id}
export interface DriverDetailDto {
    id: string
    name: string
    shortName: string
    districtId: string
    isActive: boolean
    carType?: string | null
    licensePlate?: string | null
    phoneNumber?: string | null
    lat: number
    lng: number
    lastSeen: string
}

// GET /api/drivers/{id}/stats
export interface DriverStatsDto {
    driverId: string
    name: string
    totalCompleted: number
    completedToday: number
    totalCancelled: number
    activeDeliveries: number
    onTimeRatePct: number
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
    carType?: string | null
    licensePlate?: string | null
    phoneNumber?: string | null
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
    search?: string
    pageSize?: number
}

// GET /api/alerts
export interface AnomalyAlertDto {
    id: string
    deliveryId: string
    driverId: string
    driverName: string
    anomalyType: 'EtaExceeded' | 'RouteDeviation' | 'StalePosition' | 'UnexpectedStop'
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
    pendingDeliveries: number
    avgDeliveryMinutes: number
    onTimeRatePct: number
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
    urgencyTrend: TimePointDto[]
}

export interface TrendsQueryParams {
    from: string
    to: string
    granularity: 'hour' | 'day'
}

// GET /api/analytics/pickup-density
export interface PickupPointDto {
    lat: number
    lng: number
}

export interface PickupDensityDto {
    points: PickupPointDto[]
}

export interface PickupDensityQueryParams {
    from: string
    to: string
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

// GET /api/analytics/status-breakdown
export interface StatusBreakdownItemDto {
    status: number
    label: string
    count: number
}

export interface StatusBreakdownDto {
    items: StatusBreakdownItemDto[]
}

// GET /api/analytics/district-volume
export interface DistrictVolumeItemDto {
    districtId: string
    deliveries: number
}

export interface DistrictVolumeDto {
    items: DistrictVolumeItemDto[]
}

export interface DistrictVolumeQueryParams {
    from?: string
    to?: string
}

// GET /api/analytics/district-demand-forecast
export interface DistrictDemandForecastItemDto {
    districtId: string
    districtName: string
    predictedDeliveries: number
}

export interface DistrictDemandForecastDto {
    items: DistrictDemandForecastItemDto[]
    hoursAhead: number
    generatedAt: string
}

export interface DistrictDemandForecastQueryParams {
    hoursAhead: number
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

// POST /api/deliveries/{id}/auto-assign
export interface DispatchCandidateDto {
    driverId: string
    name: string
    shortName: string
    districtId: string
    distanceM: number
    onTimeRatePct: number | null
    activeDeliveries: number
    shiftScore: number
    score: number
}

export interface AutoAssignResponseDto {
    autoAssigned: boolean
    assignedDriverId: string | null
    topCandidates: DispatchCandidateDto[]
}

// GET /api/ai/delivery/{id}/recommendation
export interface DeliveryRecommendationDto {
    deliveryId: string
    districtId: string
    topCandidates: DispatchCandidateDto[]
    recommendedAction: string | null
    recommendedDriverId: string | null
    reason: string | null
    urgencyScore: number | null
    aiAvailable: boolean
}

// GET /api/ai/district-summary/{id}
export interface DistrictSummaryDto {
    districtId: string
    summary: string
    generatedAt: string
    cachedAt: string | null
}

// GET /api/analytics/drivers
export interface HourlyOnTimePointDto {
    hour: number
    onTimeRatePct: number
    sampleCount: number
}

export interface DriverAnalyticsItemDto {
    driverId: string
    name: string
    carType: string | null
    districtId: string
    totalLast7Days: number
    completedLast7Days: number
    onTimeRatePct: number | null
    anomalyRate: number
    avgDurationSeconds: number
    districtAvgDurationSeconds: number
    onTimeByHour: HourlyOnTimePointDto[]
}

export interface DriverAnalyticsResponseDto {
    drivers: DriverAnalyticsItemDto[]
}

// GET /api/analytics/cancellations
export interface CancellationReasonDto {
    reason: string
    count: number
}

export interface CancellationAnalyticsDto {
    totalCancelled: number
    lateCancellations: number
    cancellationRate: number
    reasons: CancellationReasonDto[]
}

// GET /api/analytics/delivery-performance
export interface DistrictPerformanceDto {
    districtId: string
    deliveredCount: number
    avgActualDurationSeconds: number
    avgExpectedDurationSeconds: number
    onTimeRate: number
}

export interface DeliveryPerformanceDto {
    deliveredCount: number
    overallOnTimeRate: number
    overallAvgDurationSeconds: number
    districts: DistrictPerformanceDto[]
}

// GET /api/analytics/driver-utilization
export interface DriverThroughputItemDto {
    driverId: string
    name: string
    completedToday: number
    activeDeliveries: number
}

export interface DriverUtilizationDto {
    activeDrivers: number
    inactiveDrivers: number
    avgActiveDeliveriesPerActiveDriver: number
    topDrivers: DriverThroughputItemDto[]
}

// GET /api/analytics/anomaly-breakdown
export interface AnomalyTypeCountDto {
    anomalyType: string
    count: number
}

export interface AnomalyDistrictCountDto {
    districtId: string
    count: number
}

export interface AnomalyBreakdownDto {
    byType: AnomalyTypeCountDto[]
    byDistrict: AnomalyDistrictCountDto[]
}

// GET /api/forecast/staffing
export interface StaffingForecastResponse {
    districtId: string
    targetAt: string
    recommendedDrivers: number
    confidence: 'high' | 'medium' | 'low'
    reasoning: string
    historicalAvgDeliveries: number
}

// POST /api/analysis/transcribe
export interface TranscribeResponse {
    text: string
}

export interface DistrictGroupDto {
    id: string
    name: string
    districtIds: string[]
}

export type ApiEndpoint =
    | '/api/analytics/drivers'
    | '/api/districts'
    | '/api/districts/boundaries'
    | '/api/deliveries'
    | '/api/deliveries/{id}'
    | '/api/deliveries/{id}/auto-assign'
    | '/api/drivers'
    | '/api/drivers/{id}/availability'
    | '/api/alerts'
    | '/api/analytics/summary'
    | '/api/analytics/trends'
    | '/api/analytics/pickup-density'
    | '/api/analytics/district-volume'
    | '/api/analytics/district-demand-forecast'
    | '/api/forecast/{districtId}'
    | '/api/export/csv'
    | '/api/analysis/chat'
    | '/api/analysis/chat/stream'
    | '/api/analysis/transcribe'
    | '/api/forecast/staffing'
    | '/api/ai/delivery/{id}/recommendation'
    | '/api/ai/district-summary/{id}'
