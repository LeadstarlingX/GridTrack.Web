import { useMemo, useState, useRef, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Badge, Button } from '@/components/ui'
import { cn } from '@/lib/utils'
import CursorTable, { type CursorColumn } from '@/components/shared/CursorTable'
import DateRangePicker, { type DateRangeValue } from '@/features/analytics/DateRangePicker'
import { APP_CONFIG } from '@/config/app.config'
import { useDeliveries } from '@/lib/api/queries/useDeliveries'
import { useDistricts } from '@/lib/api/queries/useDistricts'
import type { DeliveryListItemDto, DeliveriesQueryParams } from '@/types/api'
import DeliveryTimelineDrawer from './DeliveryTimelineDrawer'
import CreateDeliveryModal from './CreateDeliveryModal'
import { Clock, X, ChevronDown, Plus } from 'lucide-react'

type StatusFilter = DeliveryListItemDto['status'] | 'all'
const STATUS_OPTIONS: StatusFilter[] = ['all', 'Created', 'Assigned', 'InTransit', 'Delivered', 'Anomalous']

function formatTimestamp(value: string) {
    return new Date(value).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}

function toIsoDate(date: Date) {
    return date.toISOString().slice(0, 10)
}

// ── Searchable district picker ──────────────────────────────────────────────
function DistrictPicker({ districts, value, onChange }: { districts: { id: string; name: string }[]; value: string; onChange: (v: string) => void }) {
    const [open, setOpen] = useState(false)
    const [search, setSearch] = useState('')
    const ref = useRef<HTMLDivElement>(null)

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
        }
        document.addEventListener('mousedown', handler)
        return () => document.removeEventListener('mousedown', handler)
    }, [])

    const filtered = useMemo(
        () => districts.filter((d) =>
            d.name.includes(search) || d.id.toLowerCase().includes(search.toLowerCase())
        ),
        [districts, search],
    )

    const selected = districts.find((d) => d.id === value)
    const label = value === 'all' ? 'الكل' : (selected?.name ?? value)

    return (
        <div ref={ref} className="relative" dir="rtl">
            <button
                type="button"
                onClick={() => setOpen((o) => !o)}
                className="flex h-7 min-w-[120px] items-center justify-between gap-1.5 rounded-md border border-[hsl(var(--border))] bg-[hsl(var(--surface))] px-2 text-xs text-[hsl(var(--foreground))]"
            >
                <span className="truncate">{label}</span>
                <ChevronDown className="h-3 w-3 shrink-0 text-[hsl(var(--foreground-muted))]" />
            </button>

            {open && (
                <div className="absolute right-0 top-full z-50 mt-1 min-w-[160px] rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--surface))] shadow-lg">
                    <div className="p-1.5">
                        <input
                            autoFocus
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="بحث…"
                            className="w-full rounded-md border border-[hsl(var(--border))] bg-[hsl(var(--surface-raised))] px-2 py-1 text-xs text-[hsl(var(--foreground))] outline-none placeholder:text-[hsl(var(--foreground-muted))]"
                        />
                    </div>
                    <div className="max-h-52 overflow-y-auto">
                        <button
                            type="button"
                            onClick={() => { onChange('all'); setOpen(false); setSearch('') }}
                            className={cn(
                                'w-full px-3 py-1.5 text-right text-xs transition-colors hover:bg-[hsl(var(--surface-raised))]',
                                value === 'all' && 'text-[hsl(var(--primary))] font-medium',
                            )}
                        >
                            الكل
                        </button>
                        {filtered.map((d) => (
                            <button
                                key={d.id}
                                type="button"
                                onClick={() => { onChange(d.id); setOpen(false); setSearch('') }}
                                className={cn(
                                    'w-full px-3 py-1.5 text-right text-xs transition-colors hover:bg-[hsl(var(--surface-raised))]',
                                    value === d.id && 'text-[hsl(var(--primary))] font-medium',
                                )}
                            >
                                {d.name}
                            </button>
                        ))}
                        {filtered.length === 0 && (
                            <p className="px-3 py-2 text-center text-xs text-[hsl(var(--foreground-muted))]">لا توجد نتائج</p>
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}

export default function DeliveriesPage() {
    const navigate = useNavigate()
    const location = useLocation()
    const [timelineId, setTimelineId] = useState<string | null>(
        () => (location.state as { openTimelineId?: string } | null)?.openTimelineId ?? null,
    )
    const [createOpen, setCreateOpen] = useState(false)
    const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
    const [districtFilter, setDistrictFilter] = useState<string>(
        () => (location.state as { districtId?: string } | null)?.districtId ?? 'all',
    )

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
    const { data: allDistricts = [] } = useDistricts()
    const districtNameMap = useMemo(
        () => Object.fromEntries(allDistricts.map((d) => [d.id, d.name])),
        [allDistricts],
    )

    const rows = useMemo(() => data?.pages.flatMap((p) => p.items) ?? [], [data])

    const selectedDistrictName = districtNameMap[districtFilter] ?? districtFilter

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
            cell: (row) => <span dir="rtl">{districtNameMap[row.districtId] ?? row.districtId}</span>,
        },
        {
            key: 'driver',
            header: 'Driver',
            cell: (row) =>
                row.assignedDriverId ? (
                    <button
                        type="button"
                        onClick={(e) => {
                            e.stopPropagation()
                            navigate('/drivers', { state: { expandDriverId: row.assignedDriverId } })
                        }}
                        className="font-medium text-[hsl(var(--foreground))] hover:text-[hsl(var(--primary))] hover:underline transition-colors"
                    >
                        {row.assignedDriverName}
                    </button>
                ) : (
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
                    Timeline
                </Button>
            ),
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
                    <div className="flex flex-wrap items-center gap-1 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--surface))] px-3 py-2">
                        <span className="mr-1 text-xs text-[hsl(var(--foreground-muted))]">Status</span>
                        {STATUS_OPTIONS.map((status) => (
                            <button
                                key={status}
                                type="button"
                                onClick={() => setStatusFilter(status)}
                                className={cn(
                                    'px-2.5 py-1 rounded-md border text-xs font-medium transition-colors',
                                    statusFilter === status
                                        ? status === 'Anomalous'
                                            ? 'border-red-500 bg-red-500/10 text-red-400'
                                            : status === 'Delivered'
                                              ? 'border-green-500 bg-green-500/10 text-green-400'
                                              : 'border-[hsl(var(--primary))] bg-[hsl(var(--primary)/0.12)] text-[hsl(var(--primary))]'
                                        : 'border-transparent text-[hsl(var(--foreground-muted))] hover:text-[hsl(var(--foreground))] hover:border-[hsl(var(--border))]',
                                )}
                            >
                                {status === 'all' ? 'All' : status}
                            </button>
                        ))}
                    </div>
                    <div className="flex items-center gap-2 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--surface))] px-3 py-2">
                        <label className="text-xs text-[hsl(var(--foreground-muted))]">District</label>
                        <DistrictPicker districts={allDistricts} value={districtFilter} onChange={setDistrictFilter} />
                    </div>
                    <DateRangePicker value={range} onChange={setRange} onApply={setAppliedRange} />
                    <Button size="sm" onClick={() => setCreateOpen(true)} className="gap-1.5">
                        <Plus size={14} />
                        New Delivery
                    </Button>
                </div>
            </header>

            {districtFilter !== 'all' && (
                <div className="flex items-center gap-2 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--primary)/0.05)] px-4 py-2.5 text-xs text-[hsl(var(--primary))]">
                    <span>Filtered by district: <span className="font-semibold" dir="rtl">{selectedDistrictName}</span></span>
                    <button
                        type="button"
                        onClick={() => setDistrictFilter('all')}
                        className="ml-auto flex items-center gap-1 rounded px-2 py-0.5 hover:bg-[hsl(var(--primary)/0.1)] transition-colors"
                    >
                        <X size={11} />
                        Clear
                    </button>
                </div>
            )}

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

            <DeliveryTimelineDrawer
                deliveryId={timelineId}
                onClose={() => setTimelineId(null)}
            />

            <CreateDeliveryModal
                open={createOpen}
                onClose={() => setCreateOpen(false)}
            />
        </div>
    )
}
