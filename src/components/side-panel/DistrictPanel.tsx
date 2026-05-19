import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useMapStore } from '@/store/mapStore'
import { getMockNeighborhoodStats } from '@/constants/mockData'

export default function DistrictPanel() {
    const boundaryId = useMapStore((s) => s.selectedDistrictId)
    const boundaries = useMapStore((s) => s.districtBoundariesGeoJSON)
    const recommendationMock = useMapStore((s) => s.recommendationMock)
    const setMode = useMapStore((s) => s.setSidePanelMode)

    if (!boundaryId) return null

    const boundaryMatch = boundaries?.features?.find((feature) => {
        const featureId = feature.properties?.boundaryId ?? String(feature.properties?.osm_id ?? '')
        return featureId === boundaryId
    })
    const boundaryName = (boundaryMatch?.properties?.displayName ?? boundaryMatch?.properties?.name_fixed ?? boundaryMatch?.properties?.name) as string | undefined
    const neighborhood = getMockNeighborhoodStats(boundaryId, boundaryName)
    const displayName = boundaryName ?? boundaryId
    const expectedDemand = recommendationMock?.[boundaryId] ?? neighborhood.expectedDemand
    const activeDrivers = neighborhood.activeDrivers
    const staffingRatio = Number((activeDrivers / Math.max(1, expectedDemand)).toFixed(2))

    return (
        <div className="p-4">
            <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-lg">{displayName}</h2>
                <Button variant="ghost" size="icon" onClick={() => setMode('idle')}>
                    <X className="h-4 w-4" />
                </Button>
            </div>
            <div className="space-y-3">
                <Card>
                    <CardHeader className="pb-2"><CardTitle className="text-sm">Boundary ID</CardTitle></CardHeader>
                    <CardContent><p className="text-2xl font-bold">{boundaryId}</p></CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2"><CardTitle className="text-sm">Expected Demand</CardTitle></CardHeader>
                    <CardContent><p className="text-2xl font-bold">{expectedDemand}</p></CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2"><CardTitle className="text-sm">Active Drivers</CardTitle></CardHeader>
                    <CardContent><p className="text-2xl font-bold">{activeDrivers}</p></CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2"><CardTitle className="text-sm">Staffing Ratio</CardTitle></CardHeader>
                    <CardContent><p className="text-2xl font-bold">{staffingRatio.toFixed(2)}</p></CardContent>
                </Card>
            </div>
        </div>
    )
}