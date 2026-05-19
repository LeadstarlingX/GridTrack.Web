import type { DriverState } from '@/types/driver'
import type { DeliveryState } from '@/types/delivery'
import type { DistrictStats } from '@/types/district'
import type { AnomalyAlert } from '@/types/hub'
import { DAMASCUS_ROUTES } from './mockRoutes'

const driverNames = [
    'Ahmad H.','Sami K.','Omar R.','Youssef M.','Ali S.',
    'Maher T.','Khaled B.','Fadi J.','Rami A.','Hassan N.',
    'Wael D.','Ibrahim L.','Mouhammad F.','Ziad C.','Tariq G.',
]

export const MOCK_DRIVERS: DriverState[] = driverNames.map((name, i) => {
    const routeIdx = i % 4
    const route = DAMASCUS_ROUTES[routeIdx]
    const driversOnRoute = Math.ceil(15 / 4)
    const posInGroup = Math.floor(i / 4)
    const segment = Math.floor(route.length / (driversOnRoute + 1))
    const ptIdx = Math.min(segment * (posInGroup + 1), route.length - 1)
    const [lat, lng] = route[ptIdx]
    return {
        id: `driver-${i + 1}`,
        name,
        lat,
        lng,
        districtId: 'district-1',
        status: i < 12 ? 'in-transit' : 'available',
        routeIndex: routeIdx,
        pointIndex: ptIdx,
    }
})

export const MOCK_DELIVERIES: DeliveryState[] = [
    { id: 'del-1', status: 'InTransit', assignedDriverId: 'driver-1', districtId: 'district-1', etaSeconds: 420, createdAt: '2026-05-17T08:00:00Z' },
    { id: 'del-2', status: 'InTransit', assignedDriverId: 'driver-2', districtId: 'district-2', etaSeconds: 780, createdAt: '2026-05-17T08:05:00Z' },
    { id: 'del-3', status: 'Delivered', assignedDriverId: 'driver-3', districtId: 'district-3', etaSeconds: null, createdAt: '2026-05-17T07:30:00Z' },
    { id: 'del-4', status: 'Assigned', assignedDriverId: 'driver-4', districtId: 'district-1', etaSeconds: 1200, createdAt: '2026-05-17T08:10:00Z' },
    { id: 'del-5', status: 'InTransit', assignedDriverId: 'driver-5', districtId: 'district-4', etaSeconds: 300, createdAt: '2026-05-17T08:15:00Z' },
    { id: 'del-6', status: 'Created', assignedDriverId: null, districtId: 'district-2', etaSeconds: null, createdAt: '2026-05-17T08:20:00Z' },
    { id: 'del-7', status: 'Delivered', assignedDriverId: 'driver-7', districtId: 'district-1', etaSeconds: null, createdAt: '2026-05-17T07:00:00Z' },
    { id: 'del-8', status: 'InTransit', assignedDriverId: 'driver-8', districtId: 'district-3', etaSeconds: 600, createdAt: '2026-05-17T08:25:00Z' },
    { id: 'del-9', status: 'Anomalous', assignedDriverId: 'driver-9', districtId: 'district-2', etaSeconds: null, createdAt: '2026-05-17T07:45:00Z' },
    { id: 'del-10', status: 'InTransit', assignedDriverId: 'driver-10', districtId: 'district-4', etaSeconds: 540, createdAt: '2026-05-17T08:30:00Z' },
    { id: 'del-11', status: 'Delivered', assignedDriverId: 'driver-11', districtId: 'district-1', etaSeconds: null, createdAt: '2026-05-16T18:10:00Z' },
    { id: 'del-12', status: 'Delivered', assignedDriverId: 'driver-12', districtId: 'district-2', etaSeconds: null, createdAt: '2026-05-16T18:35:00Z' },
    { id: 'del-13', status: 'InTransit', assignedDriverId: 'driver-13', districtId: 'district-3', etaSeconds: 360, createdAt: '2026-05-16T19:05:00Z' },
    { id: 'del-14', status: 'InTransit', assignedDriverId: 'driver-14', districtId: 'district-4', etaSeconds: 620, createdAt: '2026-05-16T19:15:00Z' },
    { id: 'del-15', status: 'Assigned', assignedDriverId: 'driver-15', districtId: 'district-1', etaSeconds: 900, createdAt: '2026-05-16T19:40:00Z' },
    { id: 'del-16', status: 'Created', assignedDriverId: null, districtId: 'district-2', etaSeconds: null, createdAt: '2026-05-16T20:00:00Z' },
    { id: 'del-17', status: 'Delivered', assignedDriverId: 'driver-1', districtId: 'district-3', etaSeconds: null, createdAt: '2026-05-15T08:10:00Z' },
    { id: 'del-18', status: 'Delivered', assignedDriverId: 'driver-2', districtId: 'district-4', etaSeconds: null, createdAt: '2026-05-15T09:10:00Z' },
    { id: 'del-19', status: 'InTransit', assignedDriverId: 'driver-3', districtId: 'district-1', etaSeconds: 480, createdAt: '2026-05-15T09:40:00Z' },
    { id: 'del-20', status: 'Anomalous', assignedDriverId: 'driver-4', districtId: 'district-2', etaSeconds: null, createdAt: '2026-05-15T10:05:00Z' },
    { id: 'del-21', status: 'Delivered', assignedDriverId: 'driver-5', districtId: 'district-4', etaSeconds: null, createdAt: '2026-05-14T13:25:00Z' },
    { id: 'del-22', status: 'Delivered', assignedDriverId: 'driver-6', districtId: 'district-3', etaSeconds: null, createdAt: '2026-05-14T14:15:00Z' },
    { id: 'del-23', status: 'Assigned', assignedDriverId: 'driver-7', districtId: 'district-2', etaSeconds: 1020, createdAt: '2026-05-14T14:30:00Z' },
    { id: 'del-24', status: 'InTransit', assignedDriverId: 'driver-8', districtId: 'district-1', etaSeconds: 510, createdAt: '2026-05-14T15:00:00Z' },
]

export const MOCK_DISTRICTS: DistrictStats[] = [
    { id: 'district-1', name: 'Mezzeh', center: [33.505, 36.245], activeDeliveries: 12, completedToday: 45, anomalyRate: 0.03 },
    { id: 'district-2', name: 'Malki', center: [33.515, 36.280], activeDeliveries: 8, completedToday: 38, anomalyRate: 0.05 },
    { id: 'district-3', name: 'Bab Touma', center: [33.520, 36.300], activeDeliveries: 6, completedToday: 22, anomalyRate: 0.02 },
    { id: 'district-4', name: 'Kafr Sousa', center: [33.500, 36.268], activeDeliveries: 10, completedToday: 31, anomalyRate: 0.04 },
]

export function getDistrictForCoords(lat: number, lng: number): DistrictStats {
    if (lng < 36.26) return MOCK_DISTRICTS[0]
    if (lat > 33.515 && lng > 36.28) return MOCK_DISTRICTS[2]
    if (lat < 33.508) return MOCK_DISTRICTS[3]
    return MOCK_DISTRICTS[1]
}

export const MOCK_ANALYTICS = {
    totalDeliveriesToday: 136,
    completionRate: 0.87,
    activeDrivers: 12,
    anomalyRate: 0.038,
}

export const MOCK_ANALYTICS_TRENDS = [
    { bucket: '06:00', deliveries: 8, anomalies: 1 },
    { bucket: '07:00', deliveries: 14, anomalies: 1 },
    { bucket: '08:00', deliveries: 22, anomalies: 2 },
    { bucket: '09:00', deliveries: 28, anomalies: 3 },
    { bucket: '10:00', deliveries: 34, anomalies: 4 },
    { bucket: '11:00', deliveries: 30, anomalies: 2 },
    { bucket: '12:00', deliveries: 26, anomalies: 3 },
    { bucket: '13:00', deliveries: 24, anomalies: 2 },
    { bucket: '14:00', deliveries: 31, anomalies: 4 },
    { bucket: '15:00', deliveries: 27, anomalies: 3 },
    { bucket: '16:00', deliveries: 20, anomalies: 2 },
    { bucket: '17:00', deliveries: 15, anomalies: 1 },
]

export const MOCK_ALERTS: AnomalyAlert[] = [
    {
        id: 'alert-1',
        deliveryId: 'del-9',
        driverId: 'driver-9',
        driverName: 'Hassan N.',
        anomalyType: 'Stall',
        reason: 'No movement for 14 minutes',
        districtId: 'district-2',
        lat: 33.512,
        lng: 36.285,
        timestamp: '2026-05-17T08:42:00Z',
    },
    {
        id: 'alert-2',
        deliveryId: 'del-4',
        driverId: 'driver-4',
        driverName: 'Ali S.',
        anomalyType: 'Delay',
        reason: 'ETA exceeded by 18 minutes',
        districtId: 'district-1',
        lat: 33.507,
        lng: 36.262,
        timestamp: '2026-05-17T08:31:00Z',
    },
    {
        id: 'alert-3',
        deliveryId: 'del-2',
        driverId: 'driver-2',
        driverName: 'Sami K.',
        anomalyType: 'RouteDeviation',
        reason: 'Driver left assigned corridor',
        districtId: 'district-2',
        lat: 33.514,
        lng: 36.292,
        timestamp: '2026-05-17T08:15:00Z',
    },
    {
        id: 'alert-4',
        deliveryId: 'del-8',
        driverId: 'driver-8',
        driverName: 'Fadi J.',
        anomalyType: 'Delay',
        reason: 'Traffic congestion flagged',
        districtId: 'district-3',
        lat: 33.521,
        lng: 36.304,
        timestamp: '2026-05-17T08:02:00Z',
    },
    {
        id: 'alert-5',
        deliveryId: 'del-5',
        driverId: 'driver-5',
        driverName: 'Maher T.',
        anomalyType: 'Stall',
        reason: 'Stopped near checkpoint',
        districtId: 'district-4',
        lat: 33.498,
        lng: 36.274,
        timestamp: '2026-05-17T07:48:00Z',
    },
]

export const MOCK_DISTRICT_VOLUME = MOCK_DISTRICTS.map((district) => ({
    district: district.name,
    deliveries: district.completedToday + district.activeDeliveries,
}))

function hashString(input: string) {
    let hash = 2166136261
    for (let i = 0; i < input.length; i += 1) {
        hash ^= input.charCodeAt(i)
        hash = Math.imul(hash, 16777619)
    }
    return hash >>> 0
}

function clamp(value: number, min: number, max: number) {
    return Math.max(min, Math.min(max, value))
}

function parseRangeDays(from: string, to: string) {
    const start = new Date(`${from}T00:00:00`)
    const end = new Date(`${to}T23:59:59`)
    const diffMs = Math.max(0, end.getTime() - start.getTime())
    return Math.max(1, Math.ceil(diffMs / 86_400_000))
}

export function getMockHistoricalHeatmapCount(h3Index: string, range: { from: string; to: string; fromHour: number; toHour: number }) {
    const days = parseRangeDays(range.from, range.to)
    const hours = Math.max(1, range.toHour - range.fromHour + 1)
    const hash = hashString(`${h3Index}:${range.from}:${range.to}:${range.fromHour}-${range.toHour}`)
    const base = 2 + (hash % 11)
    const dayBoost = 1 + Math.min(2.2, days / 5)
    const hourBoost = 1 + Math.min(1.4, hours / 8)
    const rushBoost = range.fromHour <= 8 && range.toHour >= 17 ? 1.25 : 1
    const variance = ((hash >> 8) % 100) / 100

    return clamp(Math.round(base * dayBoost * hourBoost * rushBoost + variance * 6), 0, 99)
}