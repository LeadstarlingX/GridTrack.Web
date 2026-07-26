import type { DriverState } from '@/types/driver'
import type { DeliveryState } from '@/types/delivery'
import type { DistrictStats } from '@/types/district'
import type { AnomalyAlert } from '@/types/hub'
import { DAMASCUS_ROUTES } from './mockRoutes'

const driverNames = [
    'Ahmad H.', 'Sami K.', 'Omar R.', 'Youssef M.', 'Ali S.',
    'Maher T.', 'Khaled B.', 'Fadi J.', 'Rami A.', 'Hassan N.',
    'Wael D.', 'Ibrahim L.', 'Mouhammad F.', 'Ziad C.', 'Tariq G.',
    'Nader S.', 'Bassam H.', 'Louai M.', 'Eyad R.', 'Tamer K.',
    'Amr F.', 'Jad A.', 'Karim N.', 'Rabih T.', 'Samir W.',
]

const DRIVER_DISTRICTS = [
    'district-1', 'district-2', 'district-3', 'district-4',
    'district-5', 'district-6', 'district-7', 'district-8',
]

export const MOCK_DRIVERS: DriverState[] = driverNames.map((name, i) => {
    const routeIdx = i % 6
    const route = DAMASCUS_ROUTES[routeIdx]
    const driversOnRoute = Math.ceil(driverNames.length / 6)
    const posInGroup = Math.floor(i / 6)
    const segment = Math.floor(route.length / (driversOnRoute + 1))
    const ptIdx = Math.min(segment * (posInGroup + 1), route.length - 1)
    const [lat, lng] = route[ptIdx]
    return {
        id: `driver-${i + 1}`,
        name,
        lat,
        lng,
        districtId: DRIVER_DISTRICTS[i % 8],
        status: i < 20 ? 'in-transit' : 'available',
        routeIndex: routeIdx,
        pointIndex: ptIdx,
        stalledSince: null,
    }
})

/** Converts a remaining-seconds value to an absolute ISO deadline at module load time. */
const mkDeadline = (etaSeconds: number | null): string | null =>
    etaSeconds != null ? new Date(Date.now() + etaSeconds * 1000).toISOString() : null

export const MOCK_DELIVERIES: DeliveryState[] = [
    // Today — active deliveries (2026-06-15)
    { id: 'del-1',  status: 'InTransit',  assignedDriverId: 'driver-1',  districtId: 'district-1', etaDeadline: mkDeadline(420),  createdAt: '2026-06-15T07:55:00Z', routeDistanceMeters: null, routeDurationSeconds: null, routeCost: null },
    { id: 'del-2',  status: 'InTransit',  assignedDriverId: 'driver-2',  districtId: 'district-2', etaDeadline: mkDeadline(780),  createdAt: '2026-06-15T08:05:00Z', routeDistanceMeters: null, routeDurationSeconds: null, routeCost: null },
    { id: 'del-3',  status: 'Delivered',  assignedDriverId: 'driver-3',  districtId: 'district-3', etaDeadline: mkDeadline(null), createdAt: '2026-06-15T07:20:00Z', routeDistanceMeters: null, routeDurationSeconds: null, routeCost: null },
    { id: 'del-4',  status: 'Assigned',   assignedDriverId: 'driver-4',  districtId: 'district-1', etaDeadline: mkDeadline(1200), createdAt: '2026-06-15T08:10:00Z', routeDistanceMeters: null, routeDurationSeconds: null, routeCost: null },
    { id: 'del-5',  status: 'InTransit',  assignedDriverId: 'driver-5',  districtId: 'district-4', etaDeadline: mkDeadline(300),  createdAt: '2026-06-15T08:18:00Z', routeDistanceMeters: null, routeDurationSeconds: null, routeCost: null },
    { id: 'del-6',  status: 'Created',    assignedDriverId: null,         districtId: 'district-5', etaDeadline: mkDeadline(null), createdAt: '2026-06-15T08:22:00Z', routeDistanceMeters: null, routeDurationSeconds: null, routeCost: null },
    { id: 'del-7',  status: 'Delivered',  assignedDriverId: 'driver-7',  districtId: 'district-1', etaDeadline: mkDeadline(null), createdAt: '2026-06-15T06:55:00Z', routeDistanceMeters: null, routeDurationSeconds: null, routeCost: null },
    { id: 'del-8',  status: 'InTransit',  assignedDriverId: 'driver-8',  districtId: 'district-6', etaDeadline: mkDeadline(600),  createdAt: '2026-06-15T08:28:00Z', routeDistanceMeters: null, routeDurationSeconds: null, routeCost: null },
    { id: 'del-9',  status: 'Anomalous',  assignedDriverId: 'driver-9',  districtId: 'district-2', etaDeadline: mkDeadline(null), createdAt: '2026-06-15T07:40:00Z', routeDistanceMeters: null, routeDurationSeconds: null, routeCost: null },
    { id: 'del-10', status: 'InTransit',  assignedDriverId: 'driver-10', districtId: 'district-4', etaDeadline: mkDeadline(540),  createdAt: '2026-06-15T08:33:00Z', routeDistanceMeters: null, routeDurationSeconds: null, routeCost: null },
    { id: 'del-11', status: 'InTransit',  assignedDriverId: 'driver-11', districtId: 'district-7', etaDeadline: mkDeadline(380),  createdAt: '2026-06-15T08:40:00Z', routeDistanceMeters: null, routeDurationSeconds: null, routeCost: null },
    { id: 'del-12', status: 'Assigned',   assignedDriverId: 'driver-12', districtId: 'district-8', etaDeadline: mkDeadline(900),  createdAt: '2026-06-15T08:45:00Z', routeDistanceMeters: null, routeDurationSeconds: null, routeCost: null },
    { id: 'del-13', status: 'InTransit',  assignedDriverId: 'driver-13', districtId: 'district-5', etaDeadline: mkDeadline(460),  createdAt: '2026-06-15T08:50:00Z', routeDistanceMeters: null, routeDurationSeconds: null, routeCost: null },
    { id: 'del-14', status: 'Created',    assignedDriverId: null,         districtId: 'district-3', etaDeadline: mkDeadline(null), createdAt: '2026-06-15T08:55:00Z', routeDistanceMeters: null, routeDurationSeconds: null, routeCost: null },
    { id: 'del-15', status: 'InTransit',  assignedDriverId: 'driver-15', districtId: 'district-6', etaDeadline: mkDeadline(720),  createdAt: '2026-06-15T09:00:00Z', routeDistanceMeters: null, routeDurationSeconds: null, routeCost: null },
    { id: 'del-16', status: 'Delivered',  assignedDriverId: 'driver-16', districtId: 'district-2', etaDeadline: mkDeadline(null), createdAt: '2026-06-15T07:10:00Z', routeDistanceMeters: null, routeDurationSeconds: null, routeCost: null },
    { id: 'del-17', status: 'InTransit',  assignedDriverId: 'driver-17', districtId: 'district-7', etaDeadline: mkDeadline(290),  createdAt: '2026-06-15T09:05:00Z', routeDistanceMeters: null, routeDurationSeconds: null, routeCost: null },
    { id: 'del-18', status: 'Anomalous',  assignedDriverId: 'driver-18', districtId: 'district-8', etaDeadline: mkDeadline(null), createdAt: '2026-06-15T08:00:00Z', routeDistanceMeters: null, routeDurationSeconds: null, routeCost: null },
    { id: 'del-19', status: 'InTransit',  assignedDriverId: 'driver-19', districtId: 'district-1', etaDeadline: mkDeadline(510),  createdAt: '2026-06-15T09:10:00Z', routeDistanceMeters: null, routeDurationSeconds: null, routeCost: null },
    { id: 'del-20', status: 'Assigned',   assignedDriverId: 'driver-20', districtId: 'district-4', etaDeadline: mkDeadline(1080), createdAt: '2026-06-15T09:15:00Z', routeDistanceMeters: null, routeDurationSeconds: null, routeCost: null },
    // Yesterday (2026-06-14)
    { id: 'del-21', status: 'Delivered',  assignedDriverId: 'driver-1',  districtId: 'district-3', etaDeadline: mkDeadline(null), createdAt: '2026-06-14T10:10:00Z', routeDistanceMeters: null, routeDurationSeconds: null, routeCost: null },
    { id: 'del-22', status: 'Delivered',  assignedDriverId: 'driver-2',  districtId: 'district-4', etaDeadline: mkDeadline(null), createdAt: '2026-06-14T11:05:00Z', routeDistanceMeters: null, routeDurationSeconds: null, routeCost: null },
    { id: 'del-23', status: 'Delivered',  assignedDriverId: 'driver-3',  districtId: 'district-5', etaDeadline: mkDeadline(null), createdAt: '2026-06-14T12:30:00Z', routeDistanceMeters: null, routeDurationSeconds: null, routeCost: null },
    { id: 'del-24', status: 'Delivered',  assignedDriverId: 'driver-4',  districtId: 'district-6', etaDeadline: mkDeadline(null), createdAt: '2026-06-14T13:50:00Z', routeDistanceMeters: null, routeDurationSeconds: null, routeCost: null },
    { id: 'del-25', status: 'Delivered',  assignedDriverId: 'driver-5',  districtId: 'district-7', etaDeadline: mkDeadline(null), createdAt: '2026-06-14T09:25:00Z', routeDistanceMeters: null, routeDurationSeconds: null, routeCost: null },
    { id: 'del-26', status: 'Anomalous',  assignedDriverId: 'driver-6',  districtId: 'district-2', etaDeadline: mkDeadline(null), createdAt: '2026-06-14T14:15:00Z', routeDistanceMeters: null, routeDurationSeconds: null, routeCost: null },
    { id: 'del-27', status: 'Delivered',  assignedDriverId: 'driver-7',  districtId: 'district-8', etaDeadline: mkDeadline(null), createdAt: '2026-06-14T15:20:00Z', routeDistanceMeters: null, routeDurationSeconds: null, routeCost: null },
    { id: 'del-28', status: 'Delivered',  assignedDriverId: 'driver-8',  districtId: 'district-1', etaDeadline: mkDeadline(null), createdAt: '2026-06-14T16:10:00Z', routeDistanceMeters: null, routeDurationSeconds: null, routeCost: null },
    // 2026-06-13
    { id: 'del-29', status: 'Delivered',  assignedDriverId: 'driver-9',  districtId: 'district-3', etaDeadline: mkDeadline(null), createdAt: '2026-06-13T09:00:00Z', routeDistanceMeters: null, routeDurationSeconds: null, routeCost: null },
    { id: 'del-30', status: 'Delivered',  assignedDriverId: 'driver-10', districtId: 'district-5', etaDeadline: mkDeadline(null), createdAt: '2026-06-13T10:30:00Z', routeDistanceMeters: null, routeDurationSeconds: null, routeCost: null },
    { id: 'del-31', status: 'Delivered',  assignedDriverId: 'driver-11', districtId: 'district-7', etaDeadline: mkDeadline(null), createdAt: '2026-06-13T11:45:00Z', routeDistanceMeters: null, routeDurationSeconds: null, routeCost: null },
    { id: 'del-32', status: 'Anomalous',  assignedDriverId: 'driver-12', districtId: 'district-4', etaDeadline: mkDeadline(null), createdAt: '2026-06-13T13:00:00Z', routeDistanceMeters: null, routeDurationSeconds: null, routeCost: null },
    { id: 'del-33', status: 'Delivered',  assignedDriverId: 'driver-13', districtId: 'district-6', etaDeadline: mkDeadline(null), createdAt: '2026-06-13T14:20:00Z', routeDistanceMeters: null, routeDurationSeconds: null, routeCost: null },
    { id: 'del-34', status: 'Delivered',  assignedDriverId: 'driver-14', districtId: 'district-8', etaDeadline: mkDeadline(null), createdAt: '2026-06-13T15:10:00Z', routeDistanceMeters: null, routeDurationSeconds: null, routeCost: null },
    { id: 'del-35', status: 'Delivered',  assignedDriverId: 'driver-15', districtId: 'district-2', etaDeadline: mkDeadline(null), createdAt: '2026-06-12T09:40:00Z', routeDistanceMeters: null, routeDurationSeconds: null, routeCost: null },
    { id: 'del-36', status: 'Delivered',  assignedDriverId: 'driver-16', districtId: 'district-1', etaDeadline: mkDeadline(null), createdAt: '2026-06-12T10:55:00Z', routeDistanceMeters: null, routeDurationSeconds: null, routeCost: null },
    // 2026-06-11
    { id: 'del-37', status: 'Delivered',  assignedDriverId: 'driver-1',  districtId: 'district-5', etaDeadline: mkDeadline(null), createdAt: '2026-06-11T08:10:00Z', routeDistanceMeters: null, routeDurationSeconds: null, routeCost: null },
    { id: 'del-38', status: 'Delivered',  assignedDriverId: 'driver-3',  districtId: 'district-4', etaDeadline: mkDeadline(null), createdAt: '2026-06-11T09:45:00Z', routeDistanceMeters: null, routeDurationSeconds: null, routeCost: null },
    { id: 'del-39', status: 'Delivered',  assignedDriverId: 'driver-5',  districtId: 'district-2', etaDeadline: mkDeadline(null), createdAt: '2026-06-11T11:20:00Z', routeDistanceMeters: null, routeDurationSeconds: null, routeCost: null },
    { id: 'del-40', status: 'Anomalous',  assignedDriverId: 'driver-7',  districtId: 'district-6', etaDeadline: mkDeadline(null), createdAt: '2026-06-11T13:00:00Z', routeDistanceMeters: null, routeDurationSeconds: null, routeCost: null },
    { id: 'del-41', status: 'Delivered',  assignedDriverId: 'driver-9',  districtId: 'district-7', etaDeadline: mkDeadline(null), createdAt: '2026-06-11T14:30:00Z', routeDistanceMeters: null, routeDurationSeconds: null, routeCost: null },
    { id: 'del-42', status: 'Delivered',  assignedDriverId: 'driver-11', districtId: 'district-8', etaDeadline: mkDeadline(null), createdAt: '2026-06-11T16:05:00Z', routeDistanceMeters: null, routeDurationSeconds: null, routeCost: null },
    // 2026-06-10
    { id: 'del-43', status: 'Delivered',  assignedDriverId: 'driver-2',  districtId: 'district-3', etaDeadline: mkDeadline(null), createdAt: '2026-06-10T07:50:00Z', routeDistanceMeters: null, routeDurationSeconds: null, routeCost: null },
    { id: 'del-44', status: 'Delivered',  assignedDriverId: 'driver-4',  districtId: 'district-5', etaDeadline: mkDeadline(null), createdAt: '2026-06-10T09:15:00Z', routeDistanceMeters: null, routeDurationSeconds: null, routeCost: null },
    { id: 'del-45', status: 'Delivered',  assignedDriverId: 'driver-6',  districtId: 'district-1', etaDeadline: mkDeadline(null), createdAt: '2026-06-10T10:40:00Z', routeDistanceMeters: null, routeDurationSeconds: null, routeCost: null },
    { id: 'del-46', status: 'Anomalous',  assignedDriverId: 'driver-8',  districtId: 'district-4', etaDeadline: mkDeadline(null), createdAt: '2026-06-10T12:20:00Z', routeDistanceMeters: null, routeDurationSeconds: null, routeCost: null },
    { id: 'del-47', status: 'Delivered',  assignedDriverId: 'driver-10', districtId: 'district-6', etaDeadline: mkDeadline(null), createdAt: '2026-06-10T14:55:00Z', routeDistanceMeters: null, routeDurationSeconds: null, routeCost: null },
    { id: 'del-48', status: 'Delivered',  assignedDriverId: 'driver-12', districtId: 'district-2', etaDeadline: mkDeadline(null), createdAt: '2026-06-10T16:30:00Z', routeDistanceMeters: null, routeDurationSeconds: null, routeCost: null },
    // 2026-06-09
    { id: 'del-49', status: 'Delivered',  assignedDriverId: 'driver-13', districtId: 'district-7', etaDeadline: mkDeadline(null), createdAt: '2026-06-09T08:00:00Z', routeDistanceMeters: null, routeDurationSeconds: null, routeCost: null },
    { id: 'del-50', status: 'Delivered',  assignedDriverId: 'driver-14', districtId: 'district-8', etaDeadline: mkDeadline(null), createdAt: '2026-06-09T09:30:00Z', routeDistanceMeters: null, routeDurationSeconds: null, routeCost: null },
    { id: 'del-51', status: 'Delivered',  assignedDriverId: 'driver-17', districtId: 'district-3', etaDeadline: mkDeadline(null), createdAt: '2026-06-09T11:00:00Z', routeDistanceMeters: null, routeDurationSeconds: null, routeCost: null },
    { id: 'del-52', status: 'Anomalous',  assignedDriverId: 'driver-19', districtId: 'district-5', etaDeadline: mkDeadline(null), createdAt: '2026-06-09T13:45:00Z', routeDistanceMeters: null, routeDurationSeconds: null, routeCost: null },
    { id: 'del-53', status: 'Delivered',  assignedDriverId: 'driver-21', districtId: 'district-1', etaDeadline: mkDeadline(null), createdAt: '2026-06-09T15:20:00Z', routeDistanceMeters: null, routeDurationSeconds: null, routeCost: null },
]

export const MOCK_DISTRICTS: DistrictStats[] = [
    { id: 'district-1', name: 'Mezzeh',    center: [33.505, 36.245], activeDeliveries: 12, completedToday: 45, anomalyRate: 0.03 },
    { id: 'district-2', name: 'Malki',     center: [33.515, 36.280], activeDeliveries: 8,  completedToday: 38, anomalyRate: 0.05 },
    { id: 'district-3', name: 'Bab Touma', center: [33.520, 36.300], activeDeliveries: 6,  completedToday: 22, anomalyRate: 0.02 },
    { id: 'district-4', name: 'Kafr Sousa',center: [33.500, 36.268], activeDeliveries: 10, completedToday: 31, anomalyRate: 0.04 },
    { id: 'district-5', name: 'Yarmouk',   center: [33.490, 36.283], activeDeliveries: 14, completedToday: 52, anomalyRate: 0.07 },
    { id: 'district-6', name: 'Old City',  center: [33.511, 36.308], activeDeliveries: 5,  completedToday: 18, anomalyRate: 0.03 },
    { id: 'district-7', name: 'Jobar',     center: [33.523, 36.320], activeDeliveries: 9,  completedToday: 28, anomalyRate: 0.06 },
    { id: 'district-8', name: 'Qadam',     center: [33.484, 36.295], activeDeliveries: 11, completedToday: 40, anomalyRate: 0.05 },
]

export function getDistrictForCoords(lat: number, lng: number): DistrictStats {
    if (lng < 36.26) return MOCK_DISTRICTS[0]
    if (lat < 36.49 && lng > 36.280 && lng < 36.300) return MOCK_DISTRICTS[4]
    if (lat > 33.515 && lng > 36.28) return MOCK_DISTRICTS[2]
    if (lat < 33.508) return MOCK_DISTRICTS[3]
    return MOCK_DISTRICTS[1]
}

export const MOCK_ANALYTICS = {
    totalDeliveriesToday: 248,
    completionRate: 0.87,
    activeDrivers: 22,
    anomalyRate: 0.041,
    pendingDeliveries: 16,
    avgDeliveryMinutes: 19.4,
    onTimeRatePct: 84.0,
}

// Full-day hourly trend (00:00 → 23:00) — realistic Damascus delivery pattern
export const MOCK_ANALYTICS_TRENDS = [
    { bucket: '00:00', deliveries:  2, anomalies: 0 },
    { bucket: '01:00', deliveries:  1, anomalies: 0 },
    { bucket: '02:00', deliveries:  0, anomalies: 0 },
    { bucket: '03:00', deliveries:  0, anomalies: 0 },
    { bucket: '04:00', deliveries:  1, anomalies: 0 },
    { bucket: '05:00', deliveries:  4, anomalies: 0 },
    { bucket: '06:00', deliveries: 11, anomalies: 1 },
    { bucket: '07:00', deliveries: 20, anomalies: 2 },
    { bucket: '08:00', deliveries: 31, anomalies: 3 },
    { bucket: '09:00', deliveries: 38, anomalies: 4 },
    { bucket: '10:00', deliveries: 45, anomalies: 5 },
    { bucket: '11:00', deliveries: 40, anomalies: 3 },
    { bucket: '12:00', deliveries: 32, anomalies: 4 },
    { bucket: '13:00', deliveries: 29, anomalies: 3 },
    { bucket: '14:00', deliveries: 37, anomalies: 5 },
    { bucket: '15:00', deliveries: 33, anomalies: 4 },
    { bucket: '16:00', deliveries: 26, anomalies: 2 },
    { bucket: '17:00', deliveries: 20, anomalies: 2 },
    { bucket: '18:00', deliveries: 15, anomalies: 1 },
    { bucket: '19:00', deliveries:  9, anomalies: 1 },
    { bucket: '20:00', deliveries:  6, anomalies: 0 },
    { bucket: '21:00', deliveries:  4, anomalies: 0 },
    { bucket: '22:00', deliveries:  3, anomalies: 0 },
    { bucket: '23:00', deliveries:  2, anomalies: 0 },
]

export const MOCK_ALERTS: AnomalyAlert[] = [
    {
        id: 'alert-1',
        deliveryId: 'del-9',
        driverId: 'driver-9',
        driverName: 'Hassan N.',
        anomalyType: 'StalePosition',
        reason: 'No movement for 14 minutes',
        districtId: 'district-2',
        lat: 33.512,
        lng: 36.285,
        timestamp: '2026-06-15T08:42:00Z',
    },
    {
        id: 'alert-2',
        deliveryId: 'del-4',
        driverId: 'driver-4',
        driverName: 'Youssef M.',
        anomalyType: 'EtaExceeded',
        reason: 'ETA exceeded by 18 minutes',
        districtId: 'district-1',
        lat: 33.507,
        lng: 36.262,
        timestamp: '2026-06-15T08:31:00Z',
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
        timestamp: '2026-06-15T08:15:00Z',
    },
    {
        id: 'alert-4',
        deliveryId: 'del-8',
        driverId: 'driver-8',
        driverName: 'Fadi J.',
        anomalyType: 'EtaExceeded',
        reason: 'Traffic congestion flagged',
        districtId: 'district-6',
        lat: 33.521,
        lng: 36.304,
        timestamp: '2026-06-15T08:02:00Z',
    },
    {
        id: 'alert-5',
        deliveryId: 'del-5',
        driverId: 'driver-5',
        driverName: 'Ali S.',
        anomalyType: 'StalePosition',
        reason: 'Stopped near checkpoint',
        districtId: 'district-4',
        lat: 33.498,
        lng: 36.274,
        timestamp: '2026-06-15T07:48:00Z',
    },
    {
        id: 'alert-6',
        deliveryId: 'del-18',
        driverId: 'driver-18',
        driverName: 'Eyad R.',
        anomalyType: 'UnexpectedStop',
        reason: 'Vehicle stopped in non-delivery zone for 8 min',
        districtId: 'district-8',
        lat: 33.486,
        lng: 36.302,
        timestamp: '2026-06-15T08:05:00Z',
    },
]

export interface UrgencyAlert {
    id: string
    type: 'EtaExceeded' | 'RouteDeviation' | 'StalePosition' | 'UnexpectedStop'
    driverName: string
    driverId: string
    deliveryId?: string
    districtName: string
    reason: string
    urgency: number
    aiNote: string
    time: string
}

export const MOCK_URGENCY_ALERTS: UrgencyAlert[] = [
    { id: 'a1', type: 'StalePosition',   driverName: 'Hassan N.',  driverId: 'driver-9',  deliveryId: 'del-9',  districtName: 'Malki',     reason: 'No movement for 14 min',              urgency: 9, aiNote: 'Critical — high-demand zone, zero movement. Immediate check recommended.', time: '08:42' },
    { id: 'a2', type: 'StalePosition',   driverName: 'Ali S.',     driverId: 'driver-5',  deliveryId: 'del-5',  districtName: 'Kafr Sousa',reason: 'Stopped near checkpoint',              urgency: 8, aiNote: 'High — checkpoint stop cascading delays to 3 pending orders.',            time: '07:48' },
    { id: 'a3', type: 'UnexpectedStop',  driverName: 'Eyad R.',    driverId: 'driver-18', deliveryId: 'del-18', districtName: 'Qadam',     reason: 'Vehicle stopped in non-delivery zone', urgency: 8, aiNote: 'High — unusual stop in Qadam residential block, no delivery logged.',    time: '08:05' },
    { id: 'a4', type: 'EtaExceeded',     driverName: 'Youssef M.', driverId: 'driver-4',  deliveryId: 'del-4',  districtName: 'Mezzeh',    reason: 'ETA exceeded by 18 min',              urgency: 7, aiNote: 'High — Mezzeh Autostrade congestion. Suggest reroute via eastern corridor.', time: '08:31' },
    { id: 'a5', type: 'RouteDeviation',  driverName: 'Sami K.',    driverId: 'driver-2',  deliveryId: 'del-2',  districtName: 'Malki',     reason: 'Left assigned corridor',              urgency: 6, aiNote: 'Moderate — possible road blockage. Confirm reroute with driver.',        time: '08:15' },
    { id: 'a6', type: 'EtaExceeded',     driverName: 'Fadi J.',    driverId: 'driver-8',  deliveryId: 'del-8',  districtName: 'Old City',  reason: 'Traffic congestion flagged',          urgency: 4, aiNote: 'Low — peak-hour traffic pattern. ETA automatically adjusted.',           time: '08:02' },
]

export const MOCK_DISTRICT_VOLUME = MOCK_DISTRICTS.map((district) => ({
    district: district.name,
    deliveries: district.completedToday + district.activeDeliveries,
}))

export interface RecommendationMockDistrict {
    districtId: string
    name: string
    activeDrivers: number
    expectedDemand: number
}

export const MOCK_RECOMMENDATION_DISTRICTS: RecommendationMockDistrict[] = [
    { districtId: 'district-1', name: 'Mezzeh',        activeDrivers: 5,  expectedDemand: 12 },
    { districtId: 'district-2', name: 'Malki',         activeDrivers: 4,  expectedDemand: 8  },
    { districtId: 'district-3', name: 'Bab Touma',     activeDrivers: 3,  expectedDemand: 6  },
    { districtId: 'district-4', name: 'Kafr Sousa',    activeDrivers: 6,  expectedDemand: 10 },
    { districtId: 'district-5', name: 'Yarmouk',       activeDrivers: 8,  expectedDemand: 14 },
    { districtId: 'district-6', name: 'Old City',      activeDrivers: 2,  expectedDemand: 5  },
    { districtId: 'district-7', name: 'Jobar',         activeDrivers: 5,  expectedDemand: 9  },
    { districtId: 'district-8', name: 'Qadam',         activeDrivers: 7,  expectedDemand: 11 },
    { districtId: 'district-sy0305', name: 'Yabroud',  activeDrivers: 1,  expectedDemand: 4  },
    { districtId: 'district-sy0307', name: 'Az-Zabdani', activeDrivers: 3, expectedDemand: 4 },
]

function getSeededRatioBucket(seed: number) {
    return [0.42, 0.72, 0.98, 1.28][seed % 4]
}

export function getMockDistrictStats(districtId: string, districtName?: string): DistrictStats {
    const knownDistrict = MOCK_DISTRICTS.find((district) => district.id === districtId || district.name === districtName)
    if (knownDistrict) return knownDistrict

    const seed = hashString(`${districtId}:${districtName ?? ''}`)
    const sourceDistrict = MOCK_DISTRICTS[seed % MOCK_DISTRICTS.length]
    const activeDeliveries = clamp(Math.round(sourceDistrict.activeDeliveries * (0.7 + ((seed >> 6) % 35) / 100)), 4, 22)
    const completedToday = clamp(Math.round(sourceDistrict.completedToday * (0.65 + ((seed >> 12) % 40) / 100)), 10, 80)
    const anomalyRate = clamp(Number((sourceDistrict.anomalyRate + ((seed >> 18) % 8) / 100 - 0.02).toFixed(3)), 0.01, 0.12)

    return {
        id: districtId,
        name: districtName ?? sourceDistrict.name,
        center: sourceDistrict.center,
        activeDeliveries,
        completedToday,
        anomalyRate,
    }
}

export function getMockRecommendationRatio(districtId: string, districtName?: string) {
    const district = getMockDistrictStats(districtId, districtName)
    const seed = hashString(`${districtId}:${districtName ?? district.name}`)
    const baseRatio = getSeededRatioBucket(seed)
    const loadBias = (district.completedToday / 100) * 0.06 + (district.activeDeliveries / 100) * 0.12
    const anomalyBias = district.anomalyRate * 0.35
    return clamp(Number((baseRatio + loadBias - anomalyBias).toFixed(2)), 0.25, 1.45)
}

export interface NeighborhoodStats {
    activeDrivers: number
    expectedDemand: number
    staffingRatio: number
}

export function getMockNeighborhoodStats(boundaryId: string, boundaryName?: string): NeighborhoodStats {
    const seed = hashString(`${boundaryId}:${boundaryName ?? ''}`)
    const baseDemand = 4 + (seed % 12)
    const demandNameBias = boundaryName ? Math.min(5, Math.floor(boundaryName.length / 8)) : 0
    const expectedDemand = clamp(baseDemand + demandNameBias, 2, 30)
    const driverSkew = ((seed >> 8) % 7) - 2
    const activeDrivers = clamp(Math.round(expectedDemand * (0.68 + ((seed >> 16) % 18) / 100)) + driverSkew, 1, 24)
    const staffingRatio = Number((activeDrivers / Math.max(1, expectedDemand)).toFixed(2))

    return {
        activeDrivers,
        expectedDemand,
        staffingRatio,
    }
}

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

export function getMockAnalyticsForRange(from: string, to: string) {
    const days = parseRangeDays(from, to)
    const scale = days / 1
    return {
        totalDeliveriesToday: Math.round(MOCK_ANALYTICS.totalDeliveriesToday * scale),
        completionRate: MOCK_ANALYTICS.completionRate,
        activeDrivers: MOCK_ANALYTICS.activeDrivers,
        anomalyRate: MOCK_ANALYTICS.anomalyRate,
        pendingDeliveries: Math.round(MOCK_ANALYTICS.pendingDeliveries * Math.min(scale, 3)),
        avgDeliveryMinutes: MOCK_ANALYTICS.avgDeliveryMinutes,
        onTimeRatePct: MOCK_ANALYTICS.onTimeRatePct,
    }
}
