import { useEffect } from 'react'
import { Clock, Layers, Thermometer } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useMapStore } from '@/store/mapStore'
import { APP_CONFIG } from '@/config/app.config'
import DateRangePicker, { type DateRangeValue } from '@/features/analytics/DateRangePicker'

export default function MapControls() {
    const hexEnabled = useMapStore((s) => s.hexGridEnabled)
    const heatEnabled = useMapStore((s) => s.heatmapEnabled)
    const hexResolution = useMapStore((s) => s.hexResolution)
    const historicalEnabled = useMapStore((s) => s.historicalHeatmapEnabled)
    const historicalRange = useMapStore((s) => s.historicalHeatmapRange)
    const toggleHex = useMapStore((s) => s.toggleHexGrid)
    const toggleHeat = useMapStore((s) => s.toggleHeatmap)
    const toggleHistorical = useMapStore((s) => s.toggleHistoricalHeatmap)
    const setHexResolution = useMapStore((s) => s.setHexResolution)
    const setHistoricalRange = useMapStore((s) => s.setHistoricalHeatmapRange)
    const minResolution = APP_CONFIG.map.hexResolution.min
    const allowHighRes = import.meta.env.DEV && import.meta.env[APP_CONFIG.map.hexResolution.highResEnvFlag] === 'true'
    const maxResolution = allowHighRes ? APP_CONFIG.map.hexResolution.devMax : APP_CONFIG.map.hexResolution.max

    useEffect(() => {
        if (!historicalEnabled || historicalRange) return
        const end = new Date()
        const start = new Date()
        start.setDate(end.getDate() - (APP_CONFIG.analytics.defaultRangeDays - 1))
        const next: DateRangeValue = {
            from: start.toISOString().slice(0, 10),
            to: end.toISOString().slice(0, 10),
        }
        setHistoricalRange({
            ...next,
            fromHour: APP_CONFIG.analytics.minHour,
            toHour: APP_CONFIG.analytics.maxHour,
        })
    }, [historicalEnabled, historicalRange, setHistoricalRange])

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
                <Button
                    variant={historicalEnabled ? 'default' : 'secondary'}
                    size="icon-lg"
                    onClick={toggleHistorical}
                    title="Toggle historical heatmap"
                >
                    <Clock className="h-8 w-8" />
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
            {historicalEnabled && historicalRange && (
                <div className="flex flex-col items-end gap-2 rounded-md border border-[hsl(var(--border))] bg-[hsl(var(--surface))] px-2 py-2">
                    <DateRangePicker
                        value={{ from: historicalRange.from, to: historicalRange.to }}
                        onChange={(next) => setHistoricalRange({ ...historicalRange, ...next })}
                        onApply={(next) => setHistoricalRange({ ...historicalRange, ...next })}
                    />
                    <div className="flex items-center gap-2">
                        <span className="text-[11px] text-[hsl(var(--foreground-muted))]">Hours</span>
                        <input
                            type="number"
                            min={APP_CONFIG.analytics.minHour}
                            max={APP_CONFIG.analytics.maxHour}
                            value={historicalRange.fromHour}
                            onChange={(e) => {
                                const next = Math.max(APP_CONFIG.analytics.minHour, Math.min(APP_CONFIG.analytics.maxHour, Number(e.target.value)))
                                const toHour = Math.max(next, historicalRange.toHour)
                                setHistoricalRange({ ...historicalRange, fromHour: next, toHour })
                            }}
                            className="h-7 w-14 rounded-md border border-[hsl(var(--border))] bg-[hsl(var(--surface))] px-2 text-xs text-[hsl(var(--foreground))]"
                        />
                        <span className="text-[11px] text-[hsl(var(--foreground-muted))]">to</span>
                        <input
                            type="number"
                            min={APP_CONFIG.analytics.minHour}
                            max={APP_CONFIG.analytics.maxHour}
                            value={historicalRange.toHour}
                            onChange={(e) => {
                                const next = Math.max(APP_CONFIG.analytics.minHour, Math.min(APP_CONFIG.analytics.maxHour, Number(e.target.value)))
                                const fromHour = Math.min(next, historicalRange.fromHour)
                                setHistoricalRange({ ...historicalRange, fromHour, toHour: next })
                            }}
                            className="h-7 w-14 rounded-md border border-[hsl(var(--border))] bg-[hsl(var(--surface))] px-2 text-xs text-[hsl(var(--foreground))]"
                        />
                    </div>
                </div>
            )}
        </div>
    )
}