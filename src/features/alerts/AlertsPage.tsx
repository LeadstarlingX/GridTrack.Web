import { useMemo, useState } from 'react'
import { Badge } from '@/components/ui'
import CursorTable, { type CursorColumn } from '@/components/shared/CursorTable'
import DateRangePicker, { type DateRangeValue } from '@/features/analytics/DateRangePicker'
import { useAlerts } from '@/lib/api/queries/useAlerts'
import type { AnomalyAlertDto, AlertsQueryParams } from '@/types/api'

function toIsoDate(date: Date) {
    return date.toISOString().slice(0, 10)
}

function formatTimestamp(value: string) {
    return new Date(value).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}

export default function AlertsPage() {
    const [range, setRange] = useState<DateRangeValue>(() => {
        const end = new Date()
        const start = new Date()
        start.setDate(end.getDate() - 6)
        return { from: toIsoDate(start), to: toIsoDate(end) }
    })
    const [appliedRange, setAppliedRange] = useState<DateRangeValue>(range)

    const queryParams: Omit<AlertsQueryParams, 'cursor'> = useMemo(() => ({
        from: appliedRange.from,
        to: appliedRange.to,
        pageSize: 6,
    }), [appliedRange])

    const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } = useAlerts(queryParams)

    const rows = useMemo(() => data?.pages.flatMap((p) => p.items) ?? [], [data])

    const columns: CursorColumn<AnomalyAlertDto>[] = [
        {
            key: 'time',
            header: 'Time',
            cell: (row) => formatTimestamp(row.timestamp),
        },
        {
            key: 'district',
            header: 'District',
            cell: (row) => row.districtName,
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
                nextCursor={hasNextPage ? 'has-more' : null}
                isLoading={isLoading || isFetchingNextPage}
                onLoadMore={() => fetchNextPage()}
                emptyTitle={isLoading ? 'Loading...' : 'No alerts'}
                emptyDescription={isLoading ? '' : 'You are all clear for the selected range.'}
            />
        </div>
    )
}
