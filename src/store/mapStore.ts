import { create } from 'zustand'
import { APP_CONFIG } from '@/config/app.config'
import type { ForecastDto } from '@/types/api'

type SidePanelMode = 'idle' | 'district' | 'driver' | 'focus'
export type HubStatus = 'connected' | 'reconnecting' | 'disconnected'

interface MapStore {
    hubStatus: HubStatus
    hubRtt: number | null
    heatmapEnabled: boolean
    historicalHeatmapEnabled: boolean
    recommendationEnabled: boolean
    trailEnabled: boolean
    routesEnabled: boolean
    stalledOnly: boolean
    hexResolution: number
    selectedDistrictId: string | null
    selectedDriverId: string | null
    sidePanelMode: SidePanelMode
    districtPanelView: 'details' | 'browse'
    heatmapGeoJSON: GeoJSON.FeatureCollection | null
    districtBoundariesGeoJSON: GeoJSON.FeatureCollection | null
    historicalHeatmapRange: { from: string; to: string; fromHour: number; toHour: number } | null
    historicalHeatmapData: Array<{ h3Index: string; lat: number; lng: number; count: number }> | null
    districtForecasts: Record<string, ForecastDto>

    toggleHeatmap: () => void
    toggleHistoricalHeatmap: () => void
    toggleRecommendation: () => void
    toggleTrail: () => void
    toggleRoutes: () => void
    toggleStalledOnly: () => void
    setHexResolution: (resolution: number) => void
    selectDistrict: (id: string | null) => void
    selectDriver: (id: string | null) => void
    toggleDriverPanel: (id: string) => void
    setSidePanelMode: (mode: SidePanelMode) => void
    setDistrictPanelView: (view: 'details' | 'browse') => void
    setHeatmapGeoJSON: (data: GeoJSON.FeatureCollection | null) => void
    setDistrictBoundariesGeoJSON: (data: GeoJSON.FeatureCollection | null) => void
    setHistoricalHeatmapRange: (range: { from: string; to: string; fromHour: number; toHour: number }) => void
    setHistoricalHeatmapData: (data: Array<{ h3Index: string; lat: number; lng: number; count: number }> | null) => void
    setDistrictForecast: (districtId: string, forecast: ForecastDto) => void
    setHubStatus: (status: HubStatus) => void
    setHubRtt: (ms: number | null) => void
}

export const useMapStore = create<MapStore>()((set) => ({
    hubStatus: 'disconnected',
    hubRtt: null,
    heatmapEnabled: false,
    historicalHeatmapEnabled: false,
    recommendationEnabled: false,
    trailEnabled: true,
    routesEnabled: true,
    stalledOnly: false,
    hexResolution: APP_CONFIG.map.hexResolution.default,
    selectedDistrictId: null,
    selectedDriverId: null,
    sidePanelMode: 'idle',
    districtPanelView: 'browse',
    heatmapGeoJSON: null,
    districtBoundariesGeoJSON: null,
    historicalHeatmapRange: null,
    historicalHeatmapData: null,
    districtForecasts: {},

    toggleHeatmap: () => set((s) => ({ heatmapEnabled: !s.heatmapEnabled })),
    toggleHistoricalHeatmap: () => set((s) => ({ historicalHeatmapEnabled: !s.historicalHeatmapEnabled })),
    toggleRecommendation: () => set((s) => ({ recommendationEnabled: !s.recommendationEnabled })),
    toggleTrail: () => set((s) => ({ trailEnabled: !s.trailEnabled })),
    toggleRoutes: () => set((s) => ({ routesEnabled: !s.routesEnabled })),
    toggleStalledOnly: () => set((s) => ({ stalledOnly: !s.stalledOnly })),
    setHexResolution: (resolution) => set({ hexResolution: resolution }),
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
    setHeatmapGeoJSON: (data) => set({ heatmapGeoJSON: data }),
    setDistrictBoundariesGeoJSON: (data) => set({ districtBoundariesGeoJSON: data }),
    setHistoricalHeatmapRange: (range) => set({ historicalHeatmapRange: range }),
    setHistoricalHeatmapData: (data) => set({ historicalHeatmapData: data }),
    setDistrictForecast: (districtId, forecast) =>
        set((s) => ({ districtForecasts: { ...s.districtForecasts, [districtId]: forecast } })),
    setHubStatus: (status) => set({ hubStatus: status }),
    setHubRtt: (ms) => set({ hubRtt: ms }),
}))
