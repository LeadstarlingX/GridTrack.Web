import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Badge, Button } from '@/components/ui'
import CursorTable, { type CursorColumn } from '@/components/shared/CursorTable'
import DateRangePicker, { type DateRangeValue } from '@/features/analytics/DateRangePicker'
import { APP_CONFIG } from '@/config/app.config'
import { useDeliveries } from '@/lib/api/queries/useDeliveries'
import { useDistricts } from '@/lib/api/queries/useDistricts'
import type { DeliveryListItemDto, DeliveriesQueryParams } from '@/types/api'
import DeliveryTimelineDrawer from './DeliveryTimelineDrawer'
import { Clock } from 'lucide-react'

function formatTimestamp(value: string) {
    return new Date(value).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}

function toIsoDate(date: Date) {
    return date.toISOString().slice(0, 10)
}

export default function CancelledOrdersPage() {
    const navigate = useNavigate()
    const [timelineId, setTimelineId] = useState<string | null>(null)

    const [range, setRange] = useState<DateRangeValue>(() => {
        const end = new Date()
        const start = new Date()
        start.setDate(end.getDate() - (APP_CONFIG.analytics.defaultRangeDays - 1))
        return { from: toIsoDate(start), to: toIsoDate(end) }
    })
    const [appliedRange, setAppliedRange] = useState<DateRangeValue>(range)

    const queryParams: Omit<DeliveriesQueryParams, 'cursor'> = useMemo(() => ({
        status: 'Cancelled',
        from: appliedRange.from,
        to: appliedRange.to,
        pageSize: APP_CONFIG.table.defaultPageSize,
    }), [appliedRange])

    const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } = useDeliveries(queryParams)
    const { data: allDistricts = [] } = useDistricts()
    const districtNameMap = useMemo(
        () => Object.fromEntries(allDistricts.map((d) => [d.id, d.name])),
        [allDistricts],
    )

    const rows = useMemo(() => data?.pages.flatMap((p) => p.items) ?? [], [data])

    const columns: CursorColumn<DeliveryListItemDto>[] = [
        {
            key: 'id',
            header: 'Order',
            cell: (row) => <span className="font-medium">{row.id}</span>,
        },
        {
            key: 'status',
            header: 'Status',
            cell: () => <Badge variant="destructive">Cancelled</Badge>,
        },
        {
            key: 'district',
            header: 'District',
            cell: (row) => <span dir="rtl">{districtNameMap[row.districtId] ?? row.districtId}</span>,
        },
        {
            key: 'driver',
            header: 'Driver',
            cell: (row) =>
                row.assignedDriverName ? (
                    <span className="font-medium text-[hsl(var(--foreground))]">{row.assignedDriverName}</span>
                ) : (
                    <span className="text-[hsl(var(--foreground-muted))]">Unassigned</span>
                ),
        },
        {
            key: 'created',
            header: 'Created',
            cell: (row) => formatTimestamp(row.createdAt),
        },
        {
            key: 'timeline',
            header: '',
            cell: (row) => (
                <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2 text-xs text-[hsl(var(--foreground-muted))] hover:text-[hsl(var(--foreground))]"
                    onClick={(e) => { e.stopPropagation(); setTimelineId(row.id) }}
                >
                    <Clock size={12} className="mr-1" />
                    Details
                </Button>
            ),
        },
    ]

    return (
        <div className="flex flex-col gap-6 p-6">
            <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div>
                    <h1 className="text-xl font-semibold tracking-tight text-[hsl(var(--foreground))]">Cancelled Orders</h1>
                    <p className="text-xs text-[hsl(var(--foreground-muted))]">Review and manage cancelled deliveries.</p>
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
                onRowClick={(row) => setTimelineId(row.id)}
                emptyTitle={isLoading ? 'Loading...' : 'No cancelled orders'}
                emptyDescription={isLoading ? '' : 'Nothing was cancelled in this date range.'}
            />

            <DeliveryTimelineDrawer
                deliveryId={timelineId}
                onClose={() => setTimelineId(null)}
            />

            <div className="text-[11px] text-[hsl(var(--foreground-muted))]">
                <button
                    type="button"
                    onClick={() => navigate('/deliveries')}
                    className="hover:text-[hsl(var(--primary))] transition-colors"
                >
                    ← Back to all deliveries
                </button>
            </div>
        </div>
    )
}
