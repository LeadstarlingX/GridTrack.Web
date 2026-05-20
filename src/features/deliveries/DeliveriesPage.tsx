import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Badge, Button } from '@/components/ui'
import CursorTable, { type CursorColumn } from '@/components/shared/CursorTable'
import DateRangePicker, { type DateRangeValue } from '@/features/analytics/DateRangePicker'
import { APP_CONFIG } from '@/config/app.config'
import { MOCK_DISTRICTS } from '@/constants/mockData'
import { useDeliveries } from '@/lib/api/queries/useDeliveries'
import type { DeliveryListItemDto, DeliveriesQueryParams } from '@/types/api'

type StatusFilter = DeliveryListItemDto['status'] | 'all'

const STATUS_OPTIONS: StatusFilter[] = ['all', 'Created', 'Assigned', 'InTransit', 'Delivered', 'Anomalous']

function formatTimestamp(value: string) {
    return new Date(value).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}

function toIsoDate(date: Date) {
    return date.toISOString().slice(0, 10)
}

export default function DeliveriesPage() {
    const navigate = useNavigate()
    const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
    const [districtFilter, setDistrictFilter] = useState<string>('all')
    const [range, setRange] = useState<DateRangeValue>(() => {
        const end = new Date()
        const start = new Date()
        start.setDate(end.getDate() - (APP_CONFIG.analytics.defaultRangeDays - 1))
        return { from: toIsoDate(start), to: toIsoDate(end) }
    })
    const [appliedRange, setAppliedRange] = useState<DateRangeValue>(range)

    const queryParams: Omit<DeliveriesQueryParams, 'cursor'> = useMemo(() => ({
        status: statusFilter !== 'all' ? statusFilter : undefined,
        districtId: districtFilter !== 'all' ? districtFilter : undefined,
        from: appliedRange.from,
        to: appliedRange.to,
        pageSize: APP_CONFIG.table.defaultPageSize,
    }), [statusFilter, districtFilter, appliedRange])

    const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } = useDeliveries(queryParams)

    const rows = useMemo(() => data?.pages.flatMap((p) => p.items) ?? [], [data])

    const columns: CursorColumn<DeliveryListItemDto>[] = [
        {
            key: 'id',
            header: 'Delivery',
            cell: (row) => <span className="font-medium">{row.id}</span>,
        },
        {
            key: 'status',
            header: 'Status',
            cell: (row) => {
                const variant =
                    row.status === 'Anomalous' ? 'destructive' : row.status === 'Delivered' ? 'secondary' : 'outline'
                return <Badge variant={variant}>{row.status}</Badge>
            },
        },
        {
            key: 'district',
            header: 'District',
            cell: (row) => row.districtId,
        },
        {
            key: 'driver',
            header: 'Driver',
            cell: (row) =>
                row.assignedDriverName ?? (
                    <span className="text-[hsl(var(--foreground-muted))]">Unassigned</span>
                ),
        },
        {
            key: 'eta',
            header: 'ETA',
            cell: (row) => (row.etaSeconds ? `${Math.round(row.etaSeconds / 60)}m` : '--'),
        },
        {
            key: 'created',
            header: 'Created',
            cell: (row) => formatTimestamp(row.createdAt),
        },
    ]

    return (
        <div className="flex flex-col gap-6 p-6">
            <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div>
                    <h1 className="text-xl font-semibold tracking-tight text-[hsl(var(--foreground))]">Deliveries</h1>
                    <p className="text-xs text-[hsl(var(--foreground-muted))]">Track all delivery activity.</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    <div className="flex items-center gap-2 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--surface))] px-3 py-2">
                        <label className="text-xs text-[hsl(var(--foreground-muted))]">Status</label>
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
                            className="h-7 rounded-md border border-[hsl(var(--border))] bg-[hsl(var(--surface))] px-2 text-xs text-[hsl(var(--foreground))]"
                        >
                            {STATUS_OPTIONS.map((status) => (
                                <option key={status} value={status}>
                                    {status === 'all' ? 'All' : status}
                                </option>
                            ))}
                        </select>
                        <label className="text-xs text-[hsl(var(--foreground-muted))]">District</label>
                        <select
                            value={districtFilter}
                            onChange={(e) => setDistrictFilter(e.target.value)}
                            className="h-7 rounded-md border border-[hsl(var(--border))] bg-[hsl(var(--surface))] px-2 text-xs text-[hsl(var(--foreground))]"
                        >
                            <option value="all">All</option>
                            {MOCK_DISTRICTS.map((district) => (
                                <option key={district.id} value={district.id}>
                                    {district.name}
                                </option>
                            ))}
                        </select>
                    </div>
                    <DateRangePicker value={range} onChange={setRange} onApply={setAppliedRange} />
                    <Button variant="outline" size="sm" onClick={() => setAppliedRange({ ...appliedRange })}>
                        Refresh
                    </Button>
                </div>
            </header>

            <CursorTable
                columns={columns}
                rows={rows}
                getRowId={(row) => row.id}
                nextCursor={hasNextPage ? 'has-more' : null}
                isLoading={isLoading || isFetchingNextPage}
                onLoadMore={() => fetchNextPage()}
                onRowClick={(row) => navigate('/', { state: { focusDeliveryId: row.id } })}
                emptyTitle={isLoading ? 'Loading...' : 'No deliveries'}
                emptyDescription={isLoading ? '' : 'Try a different status or date range.'}
            />
        </div>
    )
}
