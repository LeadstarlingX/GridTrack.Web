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

    return (
        <ChartContainer config={chartConfig} className="h-56 w-full">
            <BarChart data={data} layout="vertical" margin={{ left: 12, right: 12, top: 8, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" tickLine={false} axisLine={false} />
                <YAxis
                    dataKey="district"
                    type="category"
                    tickLine={false}
                    axisLine={false}
                    width={90}
                />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="predicted" fill="var(--color-predicted)" radius={[0, 4, 4, 0]} />
            </BarChart>
        </ChartContainer>
    )
}
