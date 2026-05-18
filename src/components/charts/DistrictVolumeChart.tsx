import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts'
import { ChartContainer, ChartTooltip, ChartTooltipContent, Skeleton } from '@/components/ui'

export interface DistrictVolumePoint {
    district: string
    deliveries: number
}

interface DistrictVolumeChartProps {
    data: DistrictVolumePoint[]
    isLoading?: boolean
}

const chartConfig = {
    deliveries: {
        label: 'Volume',
        color: 'hsl(var(--primary))',
    },
}

export default function DistrictVolumeChart({ data, isLoading }: DistrictVolumeChartProps) {
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
                <Bar dataKey="deliveries" fill="var(--color-deliveries)" radius={[0, 4, 4, 0]} />
            </BarChart>
        </ChartContainer>
    )
}
