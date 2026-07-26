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
        <div className="absolute top-0 right-0 bottom-0 w-80 z-[2000] bg-[hsl(var(--map-overlay))] dark:bg-[hsl(var(--map-overlay-dark))] backdrop-blur-md border-l border-[hsl(var(--border))] shadow-lg overflow-y-auto text-[hsl(var(--foreground))]">
            {mode === 'district' && (
                <div className="flex h-full flex-col">
                    <div className="flex items-start justify-between gap-2 border-b border-[hsl(var(--border))] px-4 py-3 shrink-0">
                        <div>
                            <div className="text-sm font-semibold text-[hsl(var(--foreground))]">Districts</div>
                            <div className="text-xs text-[hsl(var(--foreground-muted))]">
                                {districtPanelView === 'browse'
                                    ? 'Search and tap a neighborhood to highlight it on the map.'
                                    : 'District details'}
                            </div>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                            {districtPanelView === 'details' && (
                                <button
                                    type="button"
                                    onClick={() => setDistrictPanelView('browse')}
                                    className="rounded-md px-2 py-1 text-[11px] text-[hsl(var(--foreground-muted))] hover:bg-[hsl(var(--surface-raised))] hover:text-[hsl(var(--foreground))] transition-colors"
                                    title="Back to district list"
                                >
                                    Back
                                </button>
                            )}
                            <button
                                type="button"
                                onClick={() => setMode('idle')}
                                className="rounded-md p-1 text-[hsl(var(--foreground-muted))] hover:bg-[hsl(var(--surface-raised))] hover:text-[hsl(var(--foreground))] transition-colors"
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
