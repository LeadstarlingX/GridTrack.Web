import { useMemo, useState } from 'react'
import L from 'leaflet'
import { Search } from 'lucide-react'
import { useMapStore } from '@/store/mapStore'
import { getMapRef } from '@/lib/mapRef'

export default function NeighborhoodListPanel() {
    const boundaries = useMapStore((s) => s.districtBoundariesGeoJSON)
    const selectedDistrictId = useMapStore((s) => s.selectedDistrictId)
    const selectDistrict = useMapStore((s) => s.selectDistrict)
    const setSidePanelMode = useMapStore((s) => s.setSidePanelMode)
    const setDistrictPanelView = useMapStore((s) => s.setDistrictPanelView)
    const [query, setQuery] = useState('')

    const neighborhoods = useMemo(() => {
        const items = boundaries?.features ?? []
        return items
            .map((feature) => {
                const boundaryId = feature.properties?.boundaryId ?? String(feature.properties?.osm_id ?? '')
                const displayName = (feature.properties?.displayName ?? feature.properties?.name_fixed ?? feature.properties?.name ?? boundaryId) as string
                return { boundaryId, displayName, feature }
            })
            .filter((item) => {
                if (!query.trim()) return true
                const q = query.trim().toLowerCase()
                return item.displayName.toLowerCase().includes(q) || item.boundaryId.toLowerCase().includes(q)
            })
            .sort((a, b) => a.displayName.localeCompare(b.displayName, 'ar'))
    }, [boundaries, query])

    return (
        <div className="p-4">
            <div className="mb-4">
                <div className="text-sm font-semibold text-white">Neighborhoods</div>
                <div className="text-xs text-white/60">Select one to highlight it on the map.</div>
            </div>

            <div className="relative mb-3">
                <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-white/40" />
                <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search by Arabic name or ID"
                    className="h-9 w-full rounded-md border border-white/10 bg-white/5 pl-9 pr-3 text-sm text-white outline-none placeholder:text-white/30"
                />
            </div>

            <div className="mb-3 text-xs text-white/50">{neighborhoods.length} neighborhoods</div>

            <div className="space-y-2">
                {neighborhoods.map((item) => {
                    const active = item.boundaryId === selectedDistrictId
                    return (
                        <div
                            key={item.boundaryId}
                            className={`w-full rounded-md border px-3 py-2 transition ${active ? 'border-blue-400 bg-blue-500/15' : 'border-white/10 bg-white/5 hover:bg-white/10'}`}
                        >
                            <button
                                type="button"
                                className="w-full text-left"
                                onClick={() => {
                                    selectDistrict(item.boundaryId)
                                    const map = getMapRef()
                                    if (map) {
                                        const bounds = L.geoJSON(item.feature as any).getBounds()
                                        if (bounds.isValid()) {
                                            map.fitBounds(bounds, { padding: [32, 32], maxZoom: 15 })
                                        }
                                    }
                                }}
                            >
                                <div className="text-sm font-medium text-white">{item.displayName}</div>
                                <div className="text-[11px] text-white/45">{item.boundaryId}</div>
                            </button>
                            <div className="mt-2 flex justify-end">
                                <button
                                    type="button"
                                    className="rounded-md border border-white/15 bg-white/5 px-2 py-1 text-[11px] text-white/80 hover:bg-white/10 hover:text-white"
                                    onClick={() => {
                                        selectDistrict(item.boundaryId)
                                        setDistrictPanelView('details')
                                        setSidePanelMode('district')
                                        const map = getMapRef()
                                        if (map) {
                                            const bounds = L.geoJSON(item.feature as any).getBounds()
                                            if (bounds.isValid()) {
                                                map.fitBounds(bounds, { padding: [32, 32], maxZoom: 15 })
                                            }
                                        }
                                    }}
                                >
                                    Details
                                </button>
                            </div>
                        </div>
                    )
                })}
            </div>

            {neighborhoods.length === 0 && (
                <div className="rounded-md border border-white/10 bg-white/5 px-3 py-4 text-sm text-white/60">
                    No neighborhoods matched your search.
                </div>
            )}

            <div className="mt-4 rounded-md border border-white/10 bg-white/5 px-3 py-2 text-xs text-white/50">
                Tip: click a neighborhood on the map or choose one here to inspect its stats.
            </div>
        </div>
    )
}