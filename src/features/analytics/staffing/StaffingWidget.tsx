import { useState } from 'react'
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Skeleton } from '@/components/ui'
import { useDistricts } from '@/lib/api/queries/useDistricts'
import { useStaffing } from '@/lib/api/queries/useStaffing'

function defaultTargetAt(): string {
    const d = new Date()
    d.setMinutes(0, 0, 0)
    d.setHours(d.getHours() + 1)
    // datetime-local value: YYYY-MM-DDTHH:mm
    return d.toISOString().slice(0, 16)
}

function confidenceColor(confidence: 'high' | 'medium' | 'low'): string {
    if (confidence === 'high') return 'hsl(var(--primary))'
    if (confidence === 'medium') return '#fbbf24'
    return '#f87171'
}

export default function StaffingWidget() {
    const { data: districts } = useDistricts()
    const [districtId, setDistrictId] = useState('')
    const [targetAt, setTargetAt] = useState(defaultTargetAt)
    const [submittedParams, setSubmittedParams] = useState<{ districtId: string; targetAt: string } | null>(null)

    const { data, isLoading, isError } = useStaffing(submittedParams)

    const handleSubmit = () => {
        if (!districtId || !targetAt) return
        setSubmittedParams({
            districtId,
            targetAt: new Date(targetAt).toISOString(),
        })
    }

    const color = data ? confidenceColor(data.confidence) : undefined

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-sm font-semibold uppercase tracking-widest text-[hsl(var(--foreground-muted))]">
                    Shift Staffing Assistant
                </CardTitle>
                <CardDescription className="text-xs text-[hsl(var(--foreground-muted))]">
                    AI-powered driver recommendation for a district and time slot.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="flex flex-col gap-4">
                    <div className="flex flex-wrap items-end gap-3">
                        <div className="flex flex-col gap-1">
                            <label className="text-[11px] uppercase tracking-wide text-[hsl(var(--foreground-muted))]">District</label>
                            <select
                                value={districtId}
                                onChange={(e) => { setDistrictId(e.target.value); setSubmittedParams(null) }}
                                className="h-8 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--surface))] px-2 text-xs text-[hsl(var(--foreground))] min-w-[140px]"
                            >
                                <option value="">Select district…</option>
                                {districts?.map((d) => (
                                    <option key={d.id} value={d.id}>{d.name}</option>
                                ))}
                            </select>
                        </div>
                        <div className="flex flex-col gap-1">
                            <label className="text-[11px] uppercase tracking-wide text-[hsl(var(--foreground-muted))]">Target Time</label>
                            <input
                                type="datetime-local"
                                value={targetAt}
                                onChange={(e) => { setTargetAt(e.target.value); setSubmittedParams(null) }}
                                className="h-8 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--surface))] px-2 text-xs text-[hsl(var(--foreground))]"
                            />
                        </div>
                        <Button
                            size="sm"
                            onClick={handleSubmit}
                            disabled={!districtId || !targetAt || isLoading}
                            className="self-end"
                        >
                            {isLoading ? 'Forecasting…' : 'Get Forecast'}
                        </Button>
                    </div>

                    {isLoading && <Skeleton className="h-24 w-full" />}

                    {!isLoading && data && (
                        <div className="rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--surface))] p-4">
                            <div className="flex items-baseline gap-3 mb-2">
                                <span className="text-4xl font-bold text-[hsl(var(--foreground))]">
                                    {data.recommendedDrivers}
                                </span>
                                <span className="text-sm text-[hsl(var(--foreground-muted))]">drivers recommended</span>
                                <span
                                    className="ml-auto text-[11px] font-medium uppercase tracking-wide px-2 py-0.5 rounded-md border"
                                    style={{ color, borderColor: color }}
                                >
                                    {data.confidence} confidence
                                </span>
                            </div>
                            <p className="text-sm text-[hsl(var(--foreground-muted))] leading-relaxed">{data.reasoning}</p>
                            <p className="mt-2 text-[11px] text-[hsl(var(--foreground-subtle,var(--foreground-muted)))]">
                                Baseline: {data.historicalAvgDeliveries.toFixed(1)} avg deliveries/hr
                                {' · '}
                                {new Date(data.targetAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                            </p>
                        </div>
                    )}

                    {!isLoading && isError && (
                        <p className="text-xs text-red-400">Staffing service unavailable. Try again later.</p>
                    )}
                </div>
            </CardContent>
        </Card>
    )
}
