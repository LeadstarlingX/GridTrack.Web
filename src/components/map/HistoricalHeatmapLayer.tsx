import { Source, Layer } from 'react-map-gl/maplibre'
import { useMemo } from 'react'
import { useMapStore } from '@/store/mapStore'
import { usePickupDensity } from '@/lib/api/queries/usePickupDensity'
import type { PickupDensityQueryParams } from '@/types/api'

const EMPTY_FC: GeoJSON.FeatureCollection = { type: 'FeatureCollection', features: [] }

// GPU-side kernel density — no server-side binning, no static grid file to align against.
// Denser pickup clusters burn hotter (yellow → orange → deep red), same ramp as the old
// per-cell choropleth, just continuous instead of stepped to a hex grid.
const HEATMAP_PAINT = {
    'heatmap-weight': 1,
    'heatmap-intensity': ['interpolate', ['linear'], ['zoom'], 7, 1, 15, 3],
    'heatmap-color': [
        'interpolate', ['linear'], ['heatmap-density'],
        0,    'rgba(0,0,0,0)',
        0.25, '#fef0d9',
        0.5,  '#fdcc8a',
        0.75, '#fc8d59',
        1,    '#b30000',
    ],
    'heatmap-radius': ['interpolate', ['linear'], ['zoom'], 7, 16, 15, 36],
    'heatmap-opacity': 0.75,
} as const

export default function HistoricalHeatmapLayer() {
    const enabled = useMapStore((s) => s.historicalHeatmapEnabled)
    const range   = useMapStore((s) => s.historicalHeatmapRange)

    const densityParams: PickupDensityQueryParams | null = range
        ? { from: range.from, to: range.to, fromHour: range.fromHour, toHour: range.toHour }
        : null

    const { data: densityData } = usePickupDensity(densityParams)

    const points = useMemo<GeoJSON.FeatureCollection>(() => {
        if (!densityData) return EMPTY_FC
        return {
            type: 'FeatureCollection',
            features: densityData.points.map((p) => ({
                type: 'Feature',
                geometry: { type: 'Point', coordinates: [p.lng, p.lat] },
                properties: {},
            })),
        }
    }, [densityData])

    if (!enabled) return null

    return (
        <Source id="pickup-density" type="geojson" data={points}>
            <Layer id="pickup-density-heatmap" type="heatmap" paint={HEATMAP_PAINT as never} />
        </Source>
    )
}
