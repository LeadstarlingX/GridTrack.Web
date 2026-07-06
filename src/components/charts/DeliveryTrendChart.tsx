import { Line, LineChart, CartesianGrid, XAxis, YAxis } from 'recharts'
import { ChartContainer, ChartTooltip, ChartTooltipContent, Skeleton } from '@/components/ui'

export interface DeliveryTrendPoint {
    bucket: string
    deliveries: number
}

export interface ForecastPoint {
    bucket: string
    value: number
}

interface DeliveryTrendChartProps {
    data: DeliveryTrendPoint[]
    forecast?: ForecastPoint[]
    isLoading?: boolean
}

const chartConfig = {
    deliveries: {
        label: 'Deliveries',
        color: 'hsl(var(--primary))',
    },
    forecast: {
        label: 'Forecast',
        color: 'hsl(var(--foreground-muted))',
    },
}

export default function DeliveryTrendChart({ data, forecast, isLoading }: DeliveryTrendChartProps) {
    if (isLoading) {
        return <Skeleton className="h-56 w-full" />
    }

    // Merge actuals and forecast into a single data array for Recharts
    const combined: { bucket: string; deliveries?: number; forecast?: number }[] = [
        ...data.map((p) => ({ bucket: p.bucket.slice(0, 10), deliveries: p.deliveries })),
        ...(forecast ?? []).map((p) => ({ bucket: p.bucket.slice(0, 10), forecast: p.value })),
    ]

    return (
        <ChartContainer config={chartConfig} className="h-56 w-full">
            <LineChart data={combined} margin={{ left: 8, right: 12, top: 8, bottom: 0 }}>
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
                    connectNulls={false}
                />
                <Line
                    type="monotone"
                    dataKey="forecast"
                    stroke="var(--color-forecast)"
                    strokeWidth={2}
                    strokeDasharray="5 3"
                    dot={false}
                    connectNulls={false}
                />
            </LineChart>
        </ChartContainer>
    )
}
