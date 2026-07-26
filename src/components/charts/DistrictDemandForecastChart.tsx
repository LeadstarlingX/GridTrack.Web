import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts'
import { ChartContainer, ChartTooltip, ChartTooltipContent, Skeleton } from '@/components/ui'

export interface DistrictDemandForecastPoint {
    district: string
    districtId: string
    predicted: number
}

interface DistrictDemandForecastChartProps {
    data: DistrictDemandForecastPoint[]
    isLoading?: boolean
}

const chartConfig = {
    predicted: {
        label: 'Predicted deliveries',
        color: 'hsl(var(--primary))',
    },
}

export default function DistrictDemandForecastChart({ data, isLoading }: DistrictDemandForecastChartProps) {
    if (isLoading) {
        return <Skeleton className="h-56 w-full" />
    }

    if (data.length === 0) {
        return (
            <div className="flex h-56 items-center justify-center">
                <p className="text-xs text-[hsl(var(--foreground-muted))]">No forecast data available</p>
            </div>
        )
    }

    return (
        <ChartContainer config={chartConfig} className="h-56 w-full">
            <BarChart data={data} layout="vertical" margin={{ left: 12, right: 12, top: 8, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="hsl(var(--border))" strokeOpacity={0.6} />
                <XAxis
                    type="number"
                    tickLine={false}
                    axisLine={false}
                    tick={{ fill: 'hsl(var(--foreground-muted))', fontSize: 11 }}
                />
                <YAxis
                    dataKey="district"
                    type="category"
                    tickLine={false}
                    axisLine={false}
                    width={90}
                    tick={{ fill: 'hsl(var(--foreground-muted))', fontSize: 11 }}
                />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="predicted" fill="var(--color-predicted)" radius={[0, 4, 4, 0]} />
            </BarChart>
        </ChartContainer>
    )
}
