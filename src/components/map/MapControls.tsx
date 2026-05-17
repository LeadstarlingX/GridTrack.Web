import { Layers, Thermometer } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useMapStore } from '@/store/mapStore'

export default function MapControls() {
    const hexEnabled = useMapStore((s) => s.hexGridEnabled)
    const heatEnabled = useMapStore((s) => s.heatmapEnabled)
    const toggleHex = useMapStore((s) => s.toggleHexGrid)
    const toggleHeat = useMapStore((s) => s.toggleHeatmap)

    return (
        <div className="absolute top-4 right-4 z-[1000] flex flex-col gap-2">
            <Button
                variant={hexEnabled ? 'default' : 'secondary'}
                size="icon"
                onClick={toggleHex}
                title="Toggle hex grid"
            >
                <Layers className="h-4 w-4" />
            </Button>
            <Button
                variant={heatEnabled ? 'default' : 'secondary'}
                size="icon"
                onClick={toggleHeat}
                title="Toggle heatmap"
            >
                <Thermometer className="h-4 w-4" />
            </Button>
        </div>
    )
}