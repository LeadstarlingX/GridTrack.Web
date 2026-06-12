import { Cell, Pie, PieChart, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { Skeleton } from '@/components/ui'
import type { StatusBreakdownItemDto } from '@/types/api'

interface Props {
    data: StatusBreakdownItemDto[]
    isLoading?: boolean
}

const STATUS_COLORS: Record<string, string> = {
    Created:   'hsl(215 70% 60%)',
    Assigned:  'hsl(260 60% 65%)',
    PickedUp:  'hsl(38 90% 58%)',
    InTransit: 'hsl(200 80% 55%)',
    Delivered: 'hsl(142 70% 50%)',
    Cancelled: 'hsl(0 72% 60%)',
    Anomalous: 'hsl(25 90% 55%)',
}

function pct(value: number, total: number) {
    return total === 0 ? '0%' : `${((value / total) * 100).toFixed(1)}%`
}

export default function StatusBreakdownChart({ data, isLoading }: Props) {
    if (isLoading) return <Skeleton className="h-56 w-full" />

    const total = data.reduce((s, d) => s + d.count, 0)

    if (total === 0) {
        return (
            <div className="flex h-56 items-center justify-center text-xs text-[hsl(var(--foreground-muted))]">
                No deliveries in selected range
            </div>
        )
    }

    const chartData = data.map((d) => ({
        name: d.label,
        value: d.count,
        color: STATUS_COLORS[d.label] ?? 'hsl(var(--foreground-muted))',
    }))

    return (
        <ResponsiveContainer width="100%" height={224}>
            <PieChart>
                <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius="52%"
                    outerRadius="78%"
                    paddingAngle={2}
                    dataKey="value"
                    strokeWidth={0}
                >
                    {chartData.map((entry) => (
                        <Cell key={entry.name} fill={entry.color} />
                    ))}
                </Pie>
                <Tooltip
                    formatter={(value, name) => [
                        typeof value === 'number'
                            ? `${value.toLocaleString()} (${pct(value, total)})`
                            : String(value),
                        name,
                    ]}
                    contentStyle={{
                        background: 'hsl(var(--surface))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '6px',
                        fontSize: '11px',
                    }}
                />
                <Legend
                    iconType="circle"
                    iconSize={8}
                    formatter={(value) => (
                        <span style={{ fontSize: '11px', color: 'hsl(var(--foreground-muted))' }}>
                            {value}
                        </span>
                    )}
                />
            </PieChart>
        </ResponsiveContainer>
    )
}
