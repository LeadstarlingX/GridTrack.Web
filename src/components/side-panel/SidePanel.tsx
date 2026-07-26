import { useMapStore } from '@/store/mapStore'
import { X } from 'lucide-react'
import DriverPanel from './DriverPanel'
import FocusModePanel from './FocusModePanel'
import NeighborhoodListPanel from './NeighborhoodListPanel'
import DistrictPanel from './DistrictPanel'

export default function SidePanel() {
    const mode = useMapStore((s) => s.sidePanelMode)
    const districtPanelView = useMapStore((s) => s.districtPanelView)
    const setMode = useMapStore((s) => s.setSidePanelMode)
    const setDistrictPanelView = useMapStore((s) => s.setDistrictPanelView)

    if (mode === 'idle') return null

    return (
        <div className="absolute top-0 right-0 bottom-0 w-80 z-[2000] bg-gray-950/85 backdrop-blur-sm border-l border-white/10 shadow-lg overflow-y-auto text-white">
            {mode === 'district' && (
                <div className="flex h-full flex-col">
                    <div className="flex items-start justify-between gap-2 border-b border-white/10 px-4 py-3">
                        <div>
                            <div className="text-sm font-semibold text-white">Districts</div>
                            <div className="text-xs text-white/55">
                                {districtPanelView === 'browse'
                                    ? 'Search and tap a neighborhood to highlight it on the map.'
                                    : 'District details'}
                            </div>
                        </div>
                        <div className="flex items-center gap-1">
                            {districtPanelView === 'details' && (
                                <button
                                    type="button"
                                    onClick={() => setDistrictPanelView('browse')}
                                    className="rounded-md px-2 py-1 text-[11px] text-white/75 hover:bg-white/10 hover:text-white"
                                    title="Back to district list"
                                >
                                    Back
                                </button>
                            )}
                            <button
                                type="button"
                                onClick={() => setMode('idle')}
                                className="rounded-md p-1 text-white/65 hover:bg-white/10 hover:text-white"
                                aria-label="Close district panel"
                                title="Close"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>
                    </div>
                    <div className="flex-1 overflow-y-auto">
                        {districtPanelView === 'browse' ? <NeighborhoodListPanel /> : <DistrictPanel />}
                    </div>
                </div>
            )}
            {mode === 'driver' && <DriverPanel />}
            {mode === 'focus' && <FocusModePanel />}
        </div>
    )
}