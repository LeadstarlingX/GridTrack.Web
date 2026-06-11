import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useMapStore } from '@/store/mapStore'
import { getMockDistrictStats, getMockNeighborhoodStats } from '@/constants/mockData'
import { useForecast } from '@/lib/api/queries/useForecast'
import { useDistrictSparkline } from '@/lib/api/queries/useDistrictSparkline'
import { AreaChart, Area, Tooltip, ResponsiveContainer, XAxis } from 'recharts'
import { format } from 'date-fns'

const USE_MOCK = import.meta.env.VITE_USE_MOCK_SIGNALR !== 'false'

function SparklineChart({ districtId }: { districtId: string }) {
    const { data, isLoading } = useDistrictSparkline(USE_MOCK ? null : districtId)

    if (USE_MOCK || isLoading || !data?.length) {
        const mockPoints = Array.from({ length: 6 }, (_, i) => ({
            hour: `${i + 1}h`,
            count: Math.floor(Math.random() * 8 + 2),
        }))
        return (
            <ResponsiveContainer width="100%" height={56}>
                <AreaChart data={mockPoints} margin={{ top: 4, bottom: 0, left: 0, right: 0 }}>
                    <Area type="monotone" dataKey="count" stroke="hsl(var(--primary))" fill="hsl(var(--primary) / 0.15)" strokeWidth={1.5} dot={false} />
                </AreaChart>
            </ResponsiveContainer>
        )
    }

    const chartData = data.map((p) => ({
        hour: format(new Date(p.hour), 'HH:mm'),
        count: p.count,
    }))

    return (
        <ResponsiveContainer width="100%" height={56}>
            <AreaChart data={chartData} margin={{ top: 4, bottom: 0, left: 0, right: 0 }}>
                <XAxis dataKey="hour" hide />
                <Tooltip
                    contentStyle={{ background: 'hsl(var(--surface))', border: '1px solid hsl(var(--border))', borderRadius: 6, fontSize: 11 }}
                    formatter={(v: number) => [`${v} deliveries`, '']}
                />
                <Area type="monotone" dataKey="count" stroke="hsl(var(--primary))" fill="hsl(var(--primary) / 0.15)" strokeWidth={1.5} dot={false} />
            </AreaChart>
        </ResponsiveContainer>
    )
}

export default function DistrictPanel() {
    const boundaryId = useMapStore((s) => s.selectedDistrictId)
    const boundaries = useMapStore((s) => s.districtBoundariesGeoJSON)
    const recommendationMock = useMapStore((s) => s.recommendationMock)
    const setMode = useMapStore((s) => s.setSidePanelMode)

    const { data: forecast } = useForecast(USE_MOCK ? null : boundaryId)

    if (!boundaryId) return null

    const boundaryMatch = boundaries?.features?.find((feature) => {
        const featureId = feature.properties?.boundaryId ?? String(feature.properties?.osm_id ?? '')
        return featureId === boundaryId
    })
    const boundaryName = (boundaryMatch?.properties?.displayName ?? boundaryMatch?.properties?.name_fixed ?? boundaryMatch?.properties?.name) as string | undefined
    const neighborhood = getMockNeighborhoodStats(boundaryId, boundaryName)
    const districtStats = getMockDistrictStats(boundaryId, boundaryName)
    const displayName = boundaryName ?? boundaryId
    const expectedDemand = forecast?.forecastedDemand ?? (recommendationMock?.[boundaryId] ?? neighborhood.expectedDemand)
    const activeDrivers = neighborhood.activeDrivers
    const staffingRatio = forecast?.staffingRatio ?? Number((activeDrivers / Math.max(1, expectedDemand)).toFixed(2))
    const driverRecommendation = forecast?.driverRecommendation
    const anomalyRate = districtStats.anomalyRate

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
                    <CardHeader className="pb-1"><CardTitle className="text-sm">Demand (last 6 h)</CardTitle></CardHeader>
                    <CardContent className="pt-0 pb-3">
                        <p className="text-2xl font-bold mb-2">{expectedDemand}</p>
                        <SparklineChart districtId={boundaryId} />
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2"><CardTitle className="text-sm">Boundary ID</CardTitle></CardHeader>
                    <CardContent><p className="text-2xl font-bold">{boundaryId}</p></CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2"><CardTitle className="text-sm">Active Drivers</CardTitle></CardHeader>
                    <CardContent><p className="text-2xl font-bold">{activeDrivers}</p></CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2"><CardTitle className="text-sm">Staffing Ratio</CardTitle></CardHeader>
                    <CardContent><p className="text-2xl font-bold">{staffingRatio.toFixed(2)}</p></CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2"><CardTitle className="text-sm">Anomaly Rate</CardTitle></CardHeader>
                    <CardContent><p className="text-2xl font-bold">{(anomalyRate * 100).toFixed(1)}%</p></CardContent>
                </Card>
                {driverRecommendation !== undefined && (
                    <Card>
                        <CardHeader className="pb-2"><CardTitle className="text-sm">Recommended Drivers</CardTitle></CardHeader>
                        <CardContent><p className="text-2xl font-bold">{driverRecommendation}</p></CardContent>
                    </Card>
                )}
            </div>
        </div>
    )
}
