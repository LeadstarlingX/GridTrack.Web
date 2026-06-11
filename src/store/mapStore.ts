import { create } from 'zustand'
import { APP_CONFIG } from '@/config/app.config'
import type { ForecastDto } from '@/types/api'

type SidePanelMode = 'idle' | 'district' | 'driver' | 'focus'
export type HubStatus = 'connected' | 'reconnecting' | 'disconnected'

interface MapStore {
    hubStatus: HubStatus
    hexGridEnabled: boolean
    heatmapEnabled: boolean
    historicalHeatmapEnabled: boolean
    recommendationEnabled: boolean
    hexResolution: number
    selectedDistrictId: string | null
    selectedDriverId: string | null
    sidePanelMode: SidePanelMode
    districtPanelView: 'details' | 'browse'
    hexGeoJSON: GeoJSON.FeatureCollection | null
    heatmapGeoJSON: GeoJSON.FeatureCollection | null
    districtBoundariesGeoJSON: GeoJSON.FeatureCollection | null
    historicalHeatmapRange: {
        from: string
        to: string
        fromHour: number
        toHour: number
    } | null
    historicalHeatmapData: Array<{ h3Index: string; lat: number; lng: number; count: number }> | null
    recommendationMock: Record<string, number> | null
    districtForecasts: Record<string, ForecastDto>

    toggleHexGrid: () => void
    toggleHeatmap: () => void
    toggleHistoricalHeatmap: () => void
    toggleRecommendation: () => void
    setHexResolution: (resolution: number) => void
    selectDistrict: (id: string | null) => void
    selectDriver: (id: string | null) => void
    toggleDriverPanel: (id: string) => void
    setSidePanelMode: (mode: SidePanelMode) => void
    setDistrictPanelView: (view: 'details' | 'browse') => void
    setHexGeoJSON: (data: GeoJSON.FeatureCollection | null) => void
    setHeatmapGeoJSON: (data: GeoJSON.FeatureCollection | null) => void
    setDistrictBoundariesGeoJSON: (data: GeoJSON.FeatureCollection | null) => void
    setHistoricalHeatmapRange: (range: { from: string; to: string; fromHour: number; toHour: number }) => void
    setHistoricalHeatmapData: (data: Array<{ h3Index: string; lat: number; lng: number; count: number }> | null) => void
    setRecommendationMock: (data: Record<string, number> | null) => void
    setDistrictForecast: (districtId: string, forecast: ForecastDto) => void
    setHubStatus: (status: HubStatus) => void
    hubRtt: number | null
    setHubRtt: (ms: number | null) => void
}

export const useMapStore = create<MapStore>()((set) => ({
    hubStatus: 'disconnected',
    hubRtt: null,
    hexGridEnabled: false,
    heatmapEnabled: false,
    historicalHeatmapEnabled: false,
    recommendationEnabled: false,
    hexResolution: APP_CONFIG.map.hexResolution.default,
    selectedDistrictId: null,
    selectedDriverId: null,
    sidePanelMode: 'idle',
    districtPanelView: 'browse',
    hexGeoJSON: null,
    heatmapGeoJSON: null,
    districtBoundariesGeoJSON: null,
    historicalHeatmapRange: null,
    historicalHeatmapData: null,

    toggleHexGrid: () => set((s) => ({ hexGridEnabled: !s.hexGridEnabled })),
    toggleHeatmap: () => set((s) => ({ heatmapEnabled: !s.heatmapEnabled })),
    toggleHistoricalHeatmap: () => set((s) => ({ historicalHeatmapEnabled: !s.historicalHeatmapEnabled })),
    toggleRecommendation: () => set((s) => ({ recommendationEnabled: !s.recommendationEnabled })),
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
    setHexGeoJSON: (data) => set({ hexGeoJSON: data }),
    setHeatmapGeoJSON: (data) => set({ heatmapGeoJSON: data }),
    setDistrictBoundariesGeoJSON: (data) => set({ districtBoundariesGeoJSON: data }),
    setHistoricalHeatmapRange: (range) => set({ historicalHeatmapRange: range }),
    setHistoricalHeatmapData: (data) => set({ historicalHeatmapData: data }),
    recommendationMock: null,
    districtForecasts: {},
    setRecommendationMock: (data) => set({ recommendationMock: data }),
    setDistrictForecast: (districtId, forecast) =>
        set((s) => ({ districtForecasts: { ...s.districtForecasts, [districtId]: forecast } })),
    setHubStatus: (status) => set({ hubStatus: status }),
    setHubRtt: (ms) => set({ hubRtt: ms }),
}))