import { useEffect, useMemo, useState } from 'react'
import { Badge } from '@/components/ui'
import CursorTable, { type CursorColumn } from '@/components/shared/CursorTable'
import DateRangePicker, { type DateRangeValue } from '@/features/analytics/DateRangePicker'
import { useLiveStore } from '@/store/liveStore'
import { MOCK_ALERTS, MOCK_DISTRICTS } from '@/constants/mockData'
import type { AnomalyAlert } from '@/types/hub'

function toIsoDate(date: Date) {
    return date.toISOString().slice(0, 10)
}

function formatTimestamp(value: string) {
    return new Date(value).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}

export default function AlertsPage() {
    const anomalyQueue = useLiveStore((s) => s.anomalyQueue)
    const [visibleCount, setVisibleCount] = useState(6)
    const [range, setRange] = useState<DateRangeValue>(() => {
        const end = new Date()
        const start = new Date()
        start.setDate(end.getDate() - 6)
        return { from: toIsoDate(start), to: toIsoDate(end) }
    })
    const [appliedRange, setAppliedRange] = useState<DateRangeValue>(range)

    useEffect(() => {
        setVisibleCount(6)
    }, [appliedRange.from, appliedRange.to])

    const alerts = anomalyQueue.length > 0 ? anomalyQueue : MOCK_ALERTS

    const districtNameById = useMemo(() => {
        return Object.fromEntries(MOCK_DISTRICTS.map((district) => [district.id, district.name]))
    }, [])

    const filtered = useMemo(() => {
        const start = new Date(`${appliedRange.from}T00:00:00`)
        const end = new Date(`${appliedRange.to}T23:59:59`)
        return alerts
            .filter((alert) => {
                const created = new Date(alert.timestamp)
                return created >= start && created <= end
            })
            .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    }, [alerts, appliedRange.from, appliedRange.to])

    const rows = filtered.slice(0, visibleCount)
    const nextCursor = visibleCount < filtered.length ? `cursor-${visibleCount}` : null

    const columns: CursorColumn<AnomalyAlert>[] = [
        {
            key: 'time',
            header: 'Time',
            cell: (row) => formatTimestamp(row.timestamp),
        },
        {
            key: 'district',
            header: 'District',
            cell: (row) => districtNameById[row.districtId] ?? row.districtId,
        },
        {
            key: 'driver',
            header: 'Driver',
            cell: (row) => row.driverName,
        },
        {
            key: 'type',
            header: 'Type',
            cell: (row) => <Badge variant="destructive">{row.anomalyType}</Badge>,
        },
        {
            key: 'reason',
            header: 'Reason',
            cell: (row) => row.reason,
        },
    ]

    return (
        <div className="flex flex-col gap-6 p-6">
            <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div>
                    <h1 className="text-xl font-semibold tracking-tight text-[hsl(var(--foreground))]">Alerts</h1>
                    <p className="text-xs text-[hsl(var(--foreground-muted))]">Review anomalies and incidents.</p>
                </div>
                <DateRangePicker value={range} onChange={setRange} onApply={setAppliedRange} />
            </header>

            <CursorTable
                columns={columns}
                rows={rows}
                getRowId={(row) => row.id}
                nextCursor={nextCursor}
                onLoadMore={() => setVisibleCount((prev) => prev + 6)}
                emptyTitle="No alerts"
                emptyDescription="You are all clear for the selected range."
            />
        </div>
    )
}