import { useMapStore } from '@/store/mapStore'
import DistrictPanel from './DistrictPanel'
import DriverPanel from './DriverPanel'
import FocusModePanel from './FocusModePanel'

export default function SidePanel() {
    const mode = useMapStore((s) => s.sidePanelMode)

    if (mode === 'idle') return null

    return (
        <div className="absolute top-0 right-0 bottom-0 w-80 z-[2000] bg-gray-950/85 backdrop-blur-sm border-l border-white/10 shadow-lg overflow-y-auto text-white">
            {mode === 'district' && <DistrictPanel />}
            {mode === 'driver' && <DriverPanel />}
            {mode === 'focus' && <FocusModePanel />}
        </div>
    )
}