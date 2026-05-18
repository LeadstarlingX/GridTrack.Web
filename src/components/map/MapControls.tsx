import { useEffect } from 'react'
import { Layers, Thermometer } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useMapStore } from '@/store/mapStore'

export default function MapControls() {
    const hexEnabled = useMapStore((s) => s.hexGridEnabled)
    const heatEnabled = useMapStore((s) => s.heatmapEnabled)
    const hexResolution = useMapStore((s) => s.hexResolution)
    const toggleHex = useMapStore((s) => s.toggleHexGrid)
    const toggleHeat = useMapStore((s) => s.toggleHeatmap)
    const setHexResolution = useMapStore((s) => s.setHexResolution)
    const minResolution = 7
    const allowHighRes = import.meta.env.DEV && import.meta.env.VITE_ENABLE_HIGH_RES === 'true'
    const maxResolution = allowHighRes ? 11 : 9

    useEffect(() => {
        if (hexResolution > maxResolution) {
            setHexResolution(maxResolution)
        }
    }, [hexResolution, maxResolution, setHexResolution])

    return (
        <div className="absolute top-4 right-4 z-[1000] flex flex-col items-end gap-2">
            <div className="flex items-center gap-2">
                <Button
                    variant={hexEnabled ? 'default' : 'secondary'}
                    size="icon-lg"
                    onClick={toggleHex}
                    title="Toggle hex grid"
                >
                    <Layers className="h-8 w-8" />
                </Button>
                <Button
                    variant={heatEnabled ? 'default' : 'secondary'}
                    size="icon-lg"
                    onClick={toggleHeat}
                    title="Toggle heatmap"
                >
                    <Thermometer className="h-8 w-8" />
                </Button>
            </div>
            <div className="flex items-center gap-2 rounded-md border border-[hsl(var(--border))] bg-[hsl(var(--surface))] px-2 py-1">
                <span className="text-[11px] text-[hsl(var(--foreground-muted))]">Hex res</span>
                <input
                    type="range"
                    min={minResolution}
                    max={maxResolution}
                    step={1}
                    value={hexResolution}
                    onChange={(e) => setHexResolution(Number(e.target.value))}
                />
                <span className="text-[11px] text-[hsl(var(--foreground))]">R{hexResolution}</span>
            </div>
            <div className="rounded-md border border-[hsl(var(--border))] bg-[hsl(var(--surface))] px-2 py-1 text-[11px] text-[hsl(var(--foreground-muted))]">
                Hex {hexEnabled ? 'On' : 'Off'} · Heat {heatEnabled ? 'On' : 'Off'}
            </div>
        </div>
    )
}