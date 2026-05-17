import { useMapStore } from '@/store/mapStore'
import DistrictPanel from './DistrictPanel'
import DriverPanel from './DriverPanel'

export default function SidePanel() {
    const mode = useMapStore((s) => s.sidePanelMode)

    if (mode === 'idle') return null

    return (
        <div className="absolute top-0 right-0 bottom-0 w-80 z-[1000] bg-card border-l border-border shadow-lg overflow-y-auto">
            {mode === 'district' && <DistrictPanel />}
            {mode === 'driver' && <DriverPanel />}
            {mode === 'focus' && <div className="p-4 text-sm text-muted-foreground">Focus mode — Phase 3</div>}
        </div>
    )
}