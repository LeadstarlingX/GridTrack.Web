import { create } from 'zustand'

type SidePanelMode = 'idle' | 'district' | 'driver' | 'focus'

interface MapStore {
    hexGridEnabled: boolean
    heatmapEnabled: boolean
    historicalHeatmapEnabled: boolean
    hexResolution: number
    selectedDistrictId: string | null
    selectedDriverId: string | null
    sidePanelMode: SidePanelMode
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

    toggleHexGrid: () => void
    toggleHeatmap: () => void
    toggleHistoricalHeatmap: () => void
    setHexResolution: (resolution: number) => void
    selectDistrict: (id: string | null) => void
    selectDriver: (id: string | null) => void
    toggleDriverPanel: (id: string) => void
    setSidePanelMode: (mode: SidePanelMode) => void
    setHexGeoJSON: (data: GeoJSON.FeatureCollection) => void
    setHeatmapGeoJSON: (data: GeoJSON.FeatureCollection) => void
    setDistrictBoundariesGeoJSON: (data: GeoJSON.FeatureCollection) => void
    setHistoricalHeatmapRange: (range: { from: string; to: string; fromHour: number; toHour: number }) => void
    setHistoricalHeatmapData: (data: Array<{ h3Index: string; lat: number; lng: number; count: number }> | null) => void
}

export const useMapStore = create<MapStore>()((set) => ({
    hexGridEnabled: false,
    heatmapEnabled: false,
    historicalHeatmapEnabled: false,
    hexResolution: 8,
    selectedDistrictId: null,
    selectedDriverId: null,
    sidePanelMode: 'idle',
    hexGeoJSON: null,
    heatmapGeoJSON: null,
    districtBoundariesGeoJSON: null,
    historicalHeatmapRange: null,
    historicalHeatmapData: null,

    toggleHexGrid: () => set((s) => ({ hexGridEnabled: !s.hexGridEnabled })),
    toggleHeatmap: () => set((s) => ({ heatmapEnabled: !s.heatmapEnabled })),
    toggleHistoricalHeatmap: () => set((s) => ({ historicalHeatmapEnabled: !s.historicalHeatmapEnabled })),
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
    setHexGeoJSON: (data) => set({ hexGeoJSON: data }),
    setHeatmapGeoJSON: (data) => set({ heatmapGeoJSON: data }),
    setDistrictBoundariesGeoJSON: (data) => set({ districtBoundariesGeoJSON: data }),
    setHistoricalHeatmapRange: (range) => set({ historicalHeatmapRange: range }),
    setHistoricalHeatmapData: (data) => set({ historicalHeatmapData: data }),
}))