import type { DriverState } from '@/types/driver'
import type { DeliveryState } from '@/types/delivery'
import type { DistrictStats } from '@/types/district'
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

export const MOCK_DISTRICT_VOLUME = MOCK_DISTRICTS.map((district) => ({
    district: district.name,
    deliveries: district.completedToday + district.activeDeliveries,
}))