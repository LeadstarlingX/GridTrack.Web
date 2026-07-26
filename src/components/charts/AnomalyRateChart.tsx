import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts'
import { ChartContainer, ChartTooltip, ChartTooltipContent, Skeleton } from '@/components/ui'

export interface AnomalyRatePoint {
    bucket: string
    anomalies: number
}

interface AnomalyRateChartProps {
    data: AnomalyRatePoint[]
    isLoading?: boolean
}

const chartConfig = {
    anomalies: {
        label: 'Anomalies',
        color: 'hsl(var(--warning))',
    },
}

export default function AnomalyRateChart({ data, isLoading }: AnomalyRateChartProps) {
    if (isLoading) {
        return <Skeleton className="h-56 w-full" />
    }

    return (
        <ChartContainer config={chartConfig} className="h-56 w-full">
            <BarChart data={data} margin={{ left: 8, right: 12, top: 8, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="bucket" tickLine={false} axisLine={false} />
                <YAxis tickLine={false} axisLine={false} width={36} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="anomalies" fill="var(--color-anomalies)" radius={[4, 4, 0, 0]} />
            </BarChart>
        </ChartContainer>
    )
}
