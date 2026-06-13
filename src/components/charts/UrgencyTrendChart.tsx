import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from 'recharts'
import { ChartContainer, ChartTooltip, ChartTooltipContent, Skeleton } from '@/components/ui'

export interface UrgencyTrendPoint {
    bucket: string
    avgScore: number
}

interface UrgencyTrendChartProps {
    data: UrgencyTrendPoint[]
    isLoading?: boolean
}

const chartConfig = {
    avgScore: {
        label: 'Avg Urgency',
        color: 'hsl(var(--destructive))',
    },
}

export default function UrgencyTrendChart({ data, isLoading }: UrgencyTrendChartProps) {
    if (isLoading) {
        return <Skeleton className="h-56 w-full" />
    }

    if (data.length === 0) {
        return (
            <div className="flex h-56 items-center justify-center">
                <p className="text-xs text-[hsl(var(--foreground-muted))]">No urgency scores recorded in this range.</p>
            </div>
        )
    }

    return (
        <ChartContainer config={chartConfig} className="h-56 w-full">
            <AreaChart data={data} margin={{ left: 8, right: 12, top: 8, bottom: 0 }}>
                <defs>
                    <linearGradient id="urgencyGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--color-avgScore)" stopOpacity={0.25} />
                        <stop offset="95%" stopColor="var(--color-avgScore)" stopOpacity={0} />
                    </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="bucket" tickLine={false} axisLine={false} />
                <YAxis tickLine={false} axisLine={false} domain={[0, 10]} width={28} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Area
                    type="monotone"
                    dataKey="avgScore"
                    stroke="var(--color-avgScore)"
                    fill="url(#urgencyGrad)"
                    strokeWidth={2}
                    dot={false}
                />
            </AreaChart>
        </ChartContainer>
    )
}
