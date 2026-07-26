import { Cell, Pie, PieChart } from 'recharts'
import { ChartContainer, ChartTooltip, ChartLegend, ChartLegendContent, Skeleton } from '@/components/ui'
import type { StatusBreakdownItemDto } from '@/types/api'

interface Props {
    data: StatusBreakdownItemDto[]
    isLoading?: boolean
}

const STATUS_COLORS: Record<string, string> = {
    Created:   'hsl(var(--primary))',
    Assigned:  'hsl(var(--accent-purple))',
    PickedUp:  'hsl(var(--warning))',
    InTransit: 'hsl(200 80% 55%)',
    Delivered: 'hsl(var(--success))',
    Cancelled: 'hsl(var(--destructive))',
    Anomalous: 'hsl(25 90% 55%)',
}

// Build chartConfig so ChartContainer injects --color-* CSS vars
const chartConfig = Object.fromEntries(
    Object.entries(STATUS_COLORS).map(([key, color]) => [
        key,
        { label: key, color },
    ])
)

function pct(value: number, total: number) {
    return total === 0 ? '0%' : `${((value / total) * 100).toFixed(1)}%`
}

export default function StatusBreakdownChart({ data, isLoading }: Props) {
    if (isLoading) return <Skeleton className="h-56 w-full" />

    const total = data.reduce((s, d) => s + d.count, 0)

    if (total === 0) {
        return (
            <div className="flex h-56 items-center justify-center flex-col gap-2">
                <p className="text-xs text-[hsl(var(--foreground-muted))]">No deliveries in selected range</p>
            </div>
        )
    }

    const chartData = data.map((d) => ({
        name:  d.label,
        value: d.count,
        fill:  STATUS_COLORS[d.label] ?? 'hsl(var(--foreground-muted))',
    }))

    return (
        <ChartContainer config={chartConfig} className="h-56 w-full">
            <PieChart>
                <ChartTooltip
                    content={({ active, payload }) => {
                        if (!active || !payload?.length) return null
                        const item = payload[0]
                        return (
                            <div className="rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--surface))] px-3 py-2 shadow-md text-xs">
                                <div className="flex items-center gap-1.5 mb-0.5">
                                    <span
                                        className="inline-block h-2 w-2 rounded-full"
                                        style={{ background: item.payload?.fill }}
                                    />
                                    <span className="font-medium text-[hsl(var(--foreground))]">{item.name}</span>
                                </div>
                                <p className="text-[hsl(var(--foreground-muted))]">
                                    {(item.value as number).toLocaleString()} &middot; {pct(item.value as number, total)}
                                </p>
                            </div>
                        )
                    }}
                />
                <Pie
                    data={chartData}
                    cx="50%"
                    cy="45%"
                    innerRadius="50%"
                    outerRadius="72%"
                    paddingAngle={2}
                    dataKey="value"
                    strokeWidth={0}
                >
                    {chartData.map((entry) => (
                        <Cell key={entry.name} fill={entry.fill} />
                    ))}
                </Pie>
                <ChartLegend
                    content={
                        <ChartLegendContent
                            payload={chartData.map((d) => ({
                                value: d.name,
                                color: d.fill,
                                dataKey: d.name,
                                type:  'circle',
                            }))}
                        />
                    }
                />
            </PieChart>
        </ChartContainer>
    )
}
