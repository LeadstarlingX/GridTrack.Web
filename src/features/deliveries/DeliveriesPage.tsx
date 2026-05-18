import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Badge, Button } from '@/components/ui'
import CursorTable, { type CursorColumn } from '@/components/shared/CursorTable'
import DateRangePicker, { type DateRangeValue } from '@/features/analytics/DateRangePicker'
import { useLiveStore } from '@/store/liveStore'
import { MOCK_DISTRICTS } from '@/constants/mockData'
import type { DeliveryState, DeliveryStatus } from '@/types/delivery'

type StatusFilter = DeliveryStatus | 'all'

const STATUS_OPTIONS: StatusFilter[] = ['all', 'Created', 'Assigned', 'InTransit', 'Delivered', 'Anomalous']

function formatTimestamp(value: string) {
    return new Date(value).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}

function toIsoDate(date: Date) {
    return date.toISOString().slice(0, 10)
}

export default function DeliveriesPage() {
    const navigate = useNavigate()
    const deliveriesById = useLiveStore((s) => s.deliveries)
    const drivers = useLiveStore((s) => s.drivers)
    const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
    const [districtFilter, setDistrictFilter] = useState<string>('all')
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
    }, [statusFilter, districtFilter, appliedRange.from, appliedRange.to])

    const districtNameById = useMemo(() => {
        return Object.fromEntries(MOCK_DISTRICTS.map((district) => [district.id, district.name]))
    }, [])

    const deliveries = useMemo(() => Object.values(deliveriesById), [deliveriesById])

    const filtered = useMemo(() => {
        const start = new Date(`${appliedRange.from}T00:00:00`)
        const end = new Date(`${appliedRange.to}T23:59:59`)
        return deliveries
            .filter((delivery) => {
                if (statusFilter !== 'all' && delivery.status !== statusFilter) return false
                if (districtFilter !== 'all' && delivery.districtId !== districtFilter) return false
                const created = new Date(delivery.createdAt)
                return created >= start && created <= end
            })
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    }, [appliedRange.from, appliedRange.to, deliveries, districtFilter, statusFilter])

    const rows = filtered.slice(0, visibleCount)
    const nextCursor = visibleCount < filtered.length ? `cursor-${visibleCount}` : null

    const columns: CursorColumn<DeliveryState>[] = [
        {
            key: 'id',
            header: 'Delivery',
            cell: (row) => <span className="font-medium">{row.id}</span>,
        },
        {
            key: 'status',
            header: 'Status',
            cell: (row) => {
                const variant = row.status === 'Anomalous' ? 'destructive' : row.status === 'Delivered' ? 'secondary' : 'outline'
                return <Badge variant={variant}>{row.status}</Badge>
            },
        },
        {
            key: 'district',
            header: 'District',
            cell: (row) => districtNameById[row.districtId] ?? row.districtId,
        },
        {
            key: 'driver',
            header: 'Driver',
            cell: (row) => {
                if (!row.assignedDriverId) return <span className="text-[hsl(var(--foreground-muted))]">Unassigned</span>
                return drivers[row.assignedDriverId]?.name ?? row.assignedDriverId
            },
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
                    <Button variant="outline" size="sm" onClick={() => setAppliedRange(range)}>
                        Refresh
                    </Button>
                </div>
            </header>

            <CursorTable
                columns={columns}
                rows={rows}
                getRowId={(row) => row.id}
                nextCursor={nextCursor}
                onLoadMore={() => setVisibleCount((prev) => prev + 6)}
                onRowClick={(row) => navigate('/', { state: { focusDeliveryId: row.id } })}
                emptyTitle="No deliveries"
                emptyDescription="Try a different status or date range."
            />
        </div>
    )
}