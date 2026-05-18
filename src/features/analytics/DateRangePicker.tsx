import { useEffect, useMemo, useState } from 'react'
import { Button } from '@/components/ui'

export interface DateRangeValue {
    from: string
    to: string
}

interface DateRangePickerProps {
    value: DateRangeValue
    onChange: (next: DateRangeValue) => void
    onApply?: (next: DateRangeValue) => void
}

function toIsoDate(date: Date) {
    return date.toISOString().slice(0, 10)
}

function addDays(base: Date, days: number) {
    const next = new Date(base)
    next.setDate(next.getDate() + days)
    return next
}

export default function DateRangePicker({ value, onChange, onApply }: DateRangePickerProps) {
    const [draft, setDraft] = useState<DateRangeValue>(value)

    useEffect(() => {
        setDraft(value)
    }, [value.from, value.to])

    const isInvalid = useMemo(() => {
        if (!draft.from || !draft.to) return true
        return new Date(draft.from) > new Date(draft.to)
    }, [draft.from, draft.to])

    const apply = () => {
        if (isInvalid) return
        onChange(draft)
        onApply?.(draft)
    }

    const quickRange = (daysBack: number) => {
        const end = new Date()
        const start = addDays(end, -daysBack)
        const next = { from: toIsoDate(start), to: toIsoDate(end) }
        setDraft(next)
        onChange(next)
        onApply?.(next)
    }

    return (
        <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-2 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--surface))] px-3 py-2">
                <label className="text-xs text-[hsl(var(--foreground-muted))]">From</label>
                <input
                    type="date"
                    value={draft.from}
                    max={draft.to}
                    onChange={(e) => setDraft((prev) => ({ ...prev, from: e.target.value }))}
                    className="h-7 rounded-md border border-[hsl(var(--border))] bg-[hsl(var(--surface))] px-2 text-xs text-[hsl(var(--foreground))]"
                />
                <label className="text-xs text-[hsl(var(--foreground-muted))]">To</label>
                <input
                    type="date"
                    value={draft.to}
                    min={draft.from}
                    onChange={(e) => setDraft((prev) => ({ ...prev, to: e.target.value }))}
                    className="h-7 rounded-md border border-[hsl(var(--border))] bg-[hsl(var(--surface))] px-2 text-xs text-[hsl(var(--foreground))]"
                />
                <Button variant="outline" size="sm" onClick={apply} disabled={isInvalid}>
                    Apply
                </Button>
            </div>
            <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" onClick={() => quickRange(6)}>
                    Last 7 days
                </Button>
                <Button variant="ghost" size="sm" onClick={() => quickRange(29)}>
                    Last 30 days
                </Button>
            </div>
        </div>
    )
}
