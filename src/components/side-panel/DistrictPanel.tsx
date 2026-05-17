import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useMapStore } from '@/store/mapStore'
import { MOCK_DISTRICTS } from '@/constants/mockData'

export default function DistrictPanel() {
    const districtId = useMapStore((s) => s.selectedDistrictId)
    const setMode = useMapStore((s) => s.setSidePanelMode)

    const district = MOCK_DISTRICTS.find((d) => d.id === districtId)
    if (!district) return null

    return (
        <div className="p-4">
            <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-lg">{district.name}</h2>
                <Button variant="ghost" size="icon" onClick={() => setMode('idle')}>
                    <X className="h-4 w-4" />
                </Button>
            </div>
            <div className="space-y-3">
                <Card>
                    <CardHeader className="pb-2"><CardTitle className="text-sm">Active Deliveries</CardTitle></CardHeader>
                    <CardContent><p className="text-2xl font-bold">{district.activeDeliveries}</p></CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2"><CardTitle className="text-sm">Completed Today</CardTitle></CardHeader>
                    <CardContent><p className="text-2xl font-bold">{district.completedToday}</p></CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2"><CardTitle className="text-sm">Anomaly Rate</CardTitle></CardHeader>
                    <CardContent><p className="text-2xl font-bold">{(district.anomalyRate * 100).toFixed(1)}%</p></CardContent>
                </Card>
            </div>
        </div>
    )
}