import { Line, LineChart, CartesianGrid, XAxis, YAxis } from 'recharts'
import { ChartContainer, ChartTooltip, ChartTooltipContent, Skeleton } from '@/components/ui'

export interface DeliveryTrendPoint {
    bucket: string
    deliveries: number
}

interface DeliveryTrendChartProps {
    data: DeliveryTrendPoint[]
    isLoading?: boolean
}

const chartConfig = {
    deliveries: {
        label: 'Deliveries',
        color: 'hsl(var(--primary))',
    },
}

export default function DeliveryTrendChart({ data, isLoading }: DeliveryTrendChartProps) {
    if (isLoading) {
        return <Skeleton className="h-56 w-full" />
    }

    return (
        <ChartContainer config={chartConfig} className="h-56 w-full">
            <LineChart data={data} margin={{ left: 8, right: 12, top: 8, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="bucket" tickLine={false} axisLine={false} />
                <YAxis tickLine={false} axisLine={false} width={36} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Line
                    type="monotone"
                    dataKey="deliveries"
                    stroke="var(--color-deliveries)"
                    strokeWidth={2}
                    dot={false}
                />
            </LineChart>
        </ChartContainer>
    )
}
