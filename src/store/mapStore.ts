import { create } from 'zustand'

type SidePanelMode = 'idle' | 'district' | 'driver' | 'focus'

interface MapStore {
    hexGridEnabled: boolean
    heatmapEnabled: boolean
    hexResolution: number
    selectedDistrictId: string | null
    selectedDriverId: string | null
    sidePanelMode: SidePanelMode
    hexGeoJSON: GeoJSON.FeatureCollection | null
    heatmapGeoJSON: GeoJSON.FeatureCollection | null
    districtBoundariesGeoJSON: GeoJSON.FeatureCollection | null

    toggleHexGrid: () => void
    toggleHeatmap: () => void
    setHexResolution: (resolution: number) => void
    selectDistrict: (id: string | null) => void
    selectDriver: (id: string | null) => void
    toggleDriverPanel: (id: string) => void
    setSidePanelMode: (mode: SidePanelMode) => void
    setHexGeoJSON: (data: GeoJSON.FeatureCollection) => void
    setHeatmapGeoJSON: (data: GeoJSON.FeatureCollection) => void
    setDistrictBoundariesGeoJSON: (data: GeoJSON.FeatureCollection) => void
}

export const useMapStore = create<MapStore>()((set) => ({
    hexGridEnabled: false,
    heatmapEnabled: false,
    hexResolution: 8,
    selectedDistrictId: null,
    selectedDriverId: null,
    sidePanelMode: 'idle',
    hexGeoJSON: null,
    heatmapGeoJSON: null,
    districtBoundariesGeoJSON: null,

    toggleHexGrid: () => set((s) => ({ hexGridEnabled: !s.hexGridEnabled })),
    toggleHeatmap: () => set((s) => ({ heatmapEnabled: !s.heatmapEnabled })),
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
}))