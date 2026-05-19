import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useMapStore } from '@/store/mapStore'
import { MOCK_DISTRICTS } from '@/constants/mockData'

export default function DistrictPanel() {
    const districtId = useMapStore((s) => s.selectedDistrictId)
    const boundaries = useMapStore((s) => s.districtBoundariesGeoJSON)
    const setMode = useMapStore((s) => s.setSidePanelMode)

    if (!districtId) return null

    const boundaryMatch = boundaries?.features?.find((feature) => feature.properties?.districtId === districtId)
    const boundaryName = boundaryMatch?.properties?.name as string | undefined
    const district = MOCK_DISTRICTS.find((d) => d.id === districtId)
    const displayName = district?.name ?? boundaryName ?? districtId
    const activeDeliveries = district?.activeDeliveries ?? 0
    const completedToday = district?.completedToday ?? 0
    const anomalyRate = district?.anomalyRate ?? 0

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
                    <CardHeader className="pb-2"><CardTitle className="text-sm">Active Deliveries</CardTitle></CardHeader>
                    <CardContent><p className="text-2xl font-bold">{activeDeliveries}</p></CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2"><CardTitle className="text-sm">Completed Today</CardTitle></CardHeader>
                    <CardContent><p className="text-2xl font-bold">{completedToday}</p></CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2"><CardTitle className="text-sm">Anomaly Rate</CardTitle></CardHeader>
                    <CardContent><p className="text-2xl font-bold">{(anomalyRate * 100).toFixed(1)}%</p></CardContent>
                </Card>
            </div>
        </div>
    )
}