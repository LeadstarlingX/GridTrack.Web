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

    return (
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
    )
}
