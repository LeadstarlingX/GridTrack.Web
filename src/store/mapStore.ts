import { create } from 'zustand'
import type { ForecastDto } from '@/types/api'

type SidePanelMode = 'idle' | 'district' | 'driver' | 'focus'
export type HubStatus = 'connected' | 'reconnecting' | 'disconnected'

interface MapStore {
    hubStatus: HubStatus
    hubRtt: number | null
    historicalHeatmapEnabled: boolean
    lookbackHours: number
    recommendationEnabled: boolean
    staffingEnabled: boolean
    trailEnabled: boolean
    routesEnabled: boolean
    stalledOnly: boolean
    selectedDistrictId: string | null
    selectedDriverId: string | null
    sidePanelMode: SidePanelMode
    districtPanelView: 'details' | 'browse'
    districtBoundariesGeoJSON: GeoJSON.FeatureCollection | null
    historicalHeatmapRange: { from: string; to: string; fromHour?: number; toHour?: number } | null
    districtForecasts: Record<string, ForecastDto>

    toggleHistoricalHeatmap: () => void
    setLookbackHours: (hours: number) => void
    toggleRecommendation: () => void
    toggleStaffing: () => void
    toggleTrail: () => void
    toggleRoutes: () => void
    toggleStalledOnly: () => void
    selectDistrict: (id: string | null) => void
    selectDriver: (id: string | null) => void
    toggleDriverPanel: (id: string) => void
    setSidePanelMode: (mode: SidePanelMode) => void
    setDistrictPanelView: (view: 'details' | 'browse') => void
    setDistrictBoundariesGeoJSON: (data: GeoJSON.FeatureCollection | null) => void
    setHistoricalHeatmapRange: (range: { from: string; to: string; fromHour?: number; toHour?: number }) => void
    setDistrictForecast: (districtId: string, forecast: ForecastDto) => void
    setHubStatus: (status: HubStatus) => void
    setHubRtt: (ms: number | null) => void
}

export const useMapStore = create<MapStore>()((set) => ({
    hubStatus: 'disconnected',
    hubRtt: null,
    historicalHeatmapEnabled: false,
    lookbackHours: 3,
    recommendationEnabled: false,
    staffingEnabled: false,
    trailEnabled: true,
    routesEnabled: true,
    stalledOnly: false,
    selectedDistrictId: null,
    selectedDriverId: null,
    sidePanelMode: 'idle',
    districtPanelView: 'browse',
    districtBoundariesGeoJSON: null,
    historicalHeatmapRange: null,
    districtForecasts: {},

    toggleHistoricalHeatmap: () => set((s) => ({ historicalHeatmapEnabled: !s.historicalHeatmapEnabled })),
    setLookbackHours: (hours) => set({ lookbackHours: hours }),
    toggleRecommendation: () => set((s) => ({ recommendationEnabled: !s.recommendationEnabled })),
    toggleStaffing: () => set((s) => ({ staffingEnabled: !s.staffingEnabled })),
    toggleTrail: () => set((s) => ({ trailEnabled: !s.trailEnabled })),
    toggleRoutes: () => set((s) => ({ routesEnabled: !s.routesEnabled })),
    toggleStalledOnly: () => set((s) => ({ stalledOnly: !s.stalledOnly })),
    selectDistrict: (id) => set({ selectedDistrictId: id }),
    selectDriver: (id) => set({ selectedDriverId: id }),
    toggleDriverPanel: (id) =>
        set((s) => {
            if (s.sidePanelMode === 'focus') return s
            if (s.sidePanelMode === 'driver' && s.selectedDriverId === id) {
                return { selectedDriverId: null, sidePanelMode: 'idle' }
            }
            return { selectedDriverId: id, sidePanelMode: 'driver' }
        }),
    setSidePanelMode: (mode) => set({ sidePanelMode: mode }),
    setDistrictPanelView: (view) => set({ districtPanelView: view }),
    setDistrictBoundariesGeoJSON: (data) => set({ districtBoundariesGeoJSON: data }),
    setHistoricalHeatmapRange: (range) => set({ historicalHeatmapRange: range }),
    setDistrictForecast: (districtId, forecast) =>
        set((s) => ({ districtForecasts: { ...s.districtForecasts, [districtId]: forecast } })),
    setHubStatus: (status) => set({ hubStatus: status }),
    setHubRtt: (ms) => set({ hubRtt: ms }),
}))
