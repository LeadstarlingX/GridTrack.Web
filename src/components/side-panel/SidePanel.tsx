import { useState } from 'react'
import { Grid3X3, User, Focus, ChevronRight } from 'lucide-react'
import { useMapStore } from '@/store/mapStore'
import DistrictPanel from './DistrictPanel'
import DriverPanel from './DriverPanel'
import FocusModePanel from './FocusModePanel'
import NeighborhoodListPanel from './NeighborhoodListPanel'

export default function SidePanel() {
    const mode = useMapStore((s) => s.sidePanelMode)
    const [districtTab, setDistrictTab] = useState<'details' | 'browse'>('details')
    const setMode = useMapStore((s) => s.setSidePanelMode)

    if (mode === 'idle') return null

    return (
        <div className="absolute top-0 right-0 bottom-0 w-80 z-[2000] bg-gray-950/85 backdrop-blur-sm border-l border-white/10 shadow-lg overflow-y-auto text-white">
            <div className="flex items-center gap-2 border-b border-white/10 p-2">
                <button
                    type="button"
                    onClick={() => {
                        setMode('district')
                        setDistrictTab('browse')
                    }}
                    className={`inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-sm ${mode === 'district' ? 'bg-blue-500 text-white' : 'bg-white/5 text-white/70 hover:bg-white/10'}`}
                >
                    <Grid3X3 className="h-4 w-4" />
                    Districts
                </button>
                <button
                    type="button"
                    onClick={() => setMode('driver')}
                    className={`inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-sm ${mode === 'driver' ? 'bg-blue-500 text-white' : 'bg-white/5 text-white/70 hover:bg-white/10'}`}
                >
                    <User className="h-4 w-4" />
                    Drivers
                </button>
                <button
                    type="button"
                    onClick={() => setMode('focus')}
                    className={`inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-sm ${mode === 'focus' ? 'bg-blue-500 text-white' : 'bg-white/5 text-white/70 hover:bg-white/10'}`}
                >
                    <Focus className="h-4 w-4" />
                    Focus
                </button>
            </div>
            {mode === 'district' && (
                <div className="flex h-full flex-col">
                    <div className="flex items-center gap-2 border-b border-white/10 p-3">
                        <button
                            type="button"
                            onClick={() => setDistrictTab('details')}
                            className={`rounded-md px-3 py-1.5 text-sm ${districtTab === 'details' ? 'bg-blue-500 text-white' : 'bg-white/5 text-white/70'}`}
                        >
                            Details
                        </button>
                        <button
                            type="button"
                            onClick={() => setDistrictTab('browse')}
                            className={`rounded-md px-3 py-1.5 text-sm ${districtTab === 'browse' ? 'bg-blue-500 text-white' : 'bg-white/5 text-white/70'}`}
                        >
                            Neighborhoods
                        </button>
                    </div>
                    <div className="flex items-center gap-2 border-b border-white/10 px-3 py-2 text-[11px] text-white/45">
                        <ChevronRight className="h-3.5 w-3.5" />
                        Tap a neighborhood below to highlight it on the map.
                    </div>
                    <div className="flex-1 overflow-y-auto">
                        {districtTab === 'details' ? <DistrictPanel /> : <NeighborhoodListPanel />}
                    </div>
                </div>
            )}
            {mode === 'driver' && <DriverPanel />}
            {mode === 'focus' && <FocusModePanel />}
        </div>
    )
}