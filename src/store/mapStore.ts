import { create } from 'zustand'

type SidePanelMode = 'idle' | 'district' | 'driver' | 'focus'

interface MapStore {
    hexGridEnabled: boolean
    heatmapEnabled: boolean
    selectedDistrictId: string | null
    selectedDriverId: string | null
    sidePanelMode: SidePanelMode
    hexGeoJSON: GeoJSON.FeatureCollection | null

    toggleHexGrid: () => void
    toggleHeatmap: () => void
    selectDistrict: (id: string | null) => void
    selectDriver: (id: string | null) => void
    setSidePanelMode: (mode: SidePanelMode) => void
    setHexGeoJSON: (data: GeoJSON.FeatureCollection) => void
}

export const useMapStore = create<MapStore>()((set) => ({
    hexGridEnabled: false,
    heatmapEnabled: false,
    selectedDistrictId: null,
    selectedDriverId: null,
    sidePanelMode: 'idle',
    hexGeoJSON: null,

    toggleHexGrid: () => set((s) => ({ hexGridEnabled: !s.hexGridEnabled })),
    toggleHeatmap: () => set((s) => ({ heatmapEnabled: !s.heatmapEnabled })),
    selectDistrict: (id) => set({ selectedDistrictId: id }),
    selectDriver: (id) => set({ selectedDriverId: id }),
    setSidePanelMode: (mode) => set({ sidePanelMode: mode }),
    setHexGeoJSON: (data) => set({ hexGeoJSON: data }),
}))