import { useMemo } from 'react'
import { Source, Layer } from 'react-map-gl/maplibre'
import { useShallow } from 'zustand/react/shallow'
import { useMapStore } from '@/store/mapStore'
import { useLiveStore } from '@/store/liveStore'

const UNDERSTAFFED = 0.7
const OVERSTAFFED  = 1.3

const LEGEND = [
    { color: '#ef4444', label: 'Understaffed', hint: `< ${UNDERSTAFFED}` },
    { color: '#22c55e', label: 'Covered',      hint: `${UNDERSTAFFED}–${OVERSTAFFED}` },
    { color: '#f59e0b', label: 'Overstaffed',  hint: `> ${OVERSTAFFED}` },
    { color: '#475569', label: 'No demand',    hint: 'no active load' },
] as const

const ACTIVE_DELIVERY_STATUSES = new Set(['Created', 'Assigned', 'PickedUp', 'InTransit', 'Anomalous'])

export default function DistrictStaffingLayer() {
    const enabled    = useMapStore((s) => s.staffingEnabled)
    const boundaries = useMapStore((s) => s.districtBoundariesGeoJSON)

    // Supply: non-offline drivers per district. Demand: active (undelivered) deliveries
    // per district — both live from the store, so the choropleth works without a forecast feed.
    const driverCounts = useLiveStore(
        useShallow((s) => {
            const counts: Record<string, number> = {}
            for (const d of Object.values(s.drivers)) {
                if (d.status !== 'offline') {
                    counts[d.districtId] = (counts[d.districtId] ?? 0) + 1
                }
            }
            return counts
        }),
    )

    const demandCounts = useLiveStore(
        useShallow((s) => {
            const counts: Record<string, number> = {}
            for (const d of Object.values(s.deliveries)) {
                if (d.districtId && ACTIVE_DELIVERY_STATUSES.has(d.status)) {
                    counts[d.districtId] = (counts[d.districtId] ?? 0) + 1
                }
            }
            return counts
        }),
    )

    const geojson = useMemo<GeoJSON.FeatureCollection | null>(() => {
        if (!boundaries) return null
        return {
            ...boundaries,
            features: boundaries.features.map((f) => {
                const boundaryId = f.properties?.boundaryId ?? String(f.properties?.osm_id ?? '')
                const demand     = demandCounts[boundaryId] ?? 0
                const supply     = driverCounts[boundaryId] ?? 0
                // ratio = -1 means no active deliveries (no demand to staff against)
                const ratio      = demand > 0 ? supply / demand : -1
                return { ...f, properties: { ...f.properties, ratio } }
            }),
        }
    }, [boundaries, demandCounts, driverCounts])

    if (!enabled || !geojson) return null

    return (
        <>
            <Source id="staffing-choropleth" type="geojson" data={geojson}>
                <Layer
                    id="staffing-fill"
                    type="fill"
                    paint={{
                        'fill-color': [
                            'case',
                            ['<',  ['get', 'ratio'], 0],             '#475569', // no data
                            ['<',  ['get', 'ratio'], UNDERSTAFFED],  '#ef4444', // understaffed
                            ['>',  ['get', 'ratio'], OVERSTAFFED],   '#f59e0b', // overstaffed
                            '#22c55e',                                           // covered
                        ],
                        'fill-opacity': [
                            'case',
                            ['<', ['get', 'ratio'], 0], 0,
                            0.38,
                        ],
                    }}
                />
            </Source>

            <div className="pointer-events-none absolute bottom-4 left-4 z-[1000]">
                <div className="rounded-md border border-[hsl(var(--border))] bg-[hsl(var(--surface))]/95 px-3 py-2.5 text-[11px] shadow-lg backdrop-blur-sm space-y-1.5">
                    <p className="text-[12px] font-semibold text-[hsl(var(--foreground))]">
                        Live Staffing
                        <span className="ml-1.5 font-normal text-[hsl(var(--foreground-muted))]">active drivers ÷ demand</span>
                    </p>
                    {LEGEND.map(({ color, label, hint }) => (
                        <div key={label} className="flex items-center gap-2 whitespace-nowrap text-[hsl(var(--foreground-muted))]">
                            <span className="h-2.5 w-5 shrink-0 rounded-sm" style={{ backgroundColor: color, opacity: label === 'No demand' ? 0.45 : 1 }} />
                            <span>{label}</span>
                            <span className="ml-auto pl-3 text-[10px] opacity-60">{hint}</span>
                        </div>
                    ))}
                </div>
            </div>
        </>
    )
}
