import { useMemo, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { Badge, Button } from '@/components/ui'
import { cn } from '@/lib/utils'
import CursorTable, { type CursorColumn } from '@/components/shared/CursorTable'
import { APP_CONFIG } from '@/config/app.config'
import { MOCK_DISTRICTS } from '@/constants/mockData'
import { useDrivers } from '@/lib/api/queries/useDrivers'
import { useDriverAvailability } from '@/lib/api/queries/useDriverAvailability'
import type { DriverListItemDto } from '@/types/api'
import DriverPerformanceCard from './DriverPerformanceCard'
import { Car, ChevronDown, ChevronUp, Phone } from 'lucide-react'

type DriverStatusFilter = 'all' | DriverListItemDto['status']
const STATUS_PILLS: { value: DriverStatusFilter; label: string }[] = [
    { value: 'all', label: 'All' },
    { value: 'available', label: 'Available' },
    { value: 'in-transit', label: 'In Transit' },
    { value: 'offline', label: 'Offline' },
]

export default function DriversPage() {
    const location = useLocation()
    const [expandedId, setExpandedId] = useState<string | null>(
        () => (location.state as { expandDriverId?: string } | null)?.expandDriverId ?? null,
    )
    const [statusFilter, setStatusFilter] = useState<DriverStatusFilter>('all')
    const [districtFilter, setDistrictFilter] = useState<string>('all')

    const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } = useDrivers({
        pageSize: APP_CONFIG.table.driversPageSize,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        districtId: districtFilter !== 'all' ? districtFilter : undefined,
    })

    const { mutate: setAvailability, isPending } = useDriverAvailability()

    const rows = useMemo(() => data?.pages.flatMap((p) => p.items) ?? [], [data])

    const toggleExpanded = (id: string) => setExpandedId((prev) => (prev === id ? null : id))

    const columns: CursorColumn<DriverListItemDto>[] = [
        {
            key: 'name',
            header: 'Driver',
            cell: (row) => (
                <div>
                    <p className="font-medium">{row.name}</p>
                    {row.licensePlate && (
                        <p className="flex items-center gap-1 text-xs font-mono text-[hsl(var(--foreground-muted))]">
                            <Car size={10} />
                            {row.licensePlate}
                            {row.carType && <span className="ml-1 text-[hsl(var(--foreground-subtle,var(--foreground-muted)))]">· {row.carType}</span>}
                        </p>
                    )}
                </div>
            ),
        },
        {
            key: 'district',
            header: 'District',
            cell: (row) => row.districtName,
        },
        {
            key: 'phone',
            header: 'Phone',
            cell: (row) => row.phoneNumber
                ? (
                    <span className="flex items-center gap-1 text-xs text-[hsl(var(--foreground-muted))]">
                        <Phone size={10} />
                        {row.phoneNumber}
                    </span>
                )
                : <span className="text-xs text-[hsl(var(--foreground-muted))]">—</span>,
        },
        {
            key: 'status',
            header: 'Status',
            cell: (row) => {
                const variant =
                    row.status === 'in-transit' ? 'default' : row.status === 'available' ? 'secondary' : 'outline'
                return <Badge variant={variant}>{row.status}</Badge>
            },
        },
        {
            key: 'action',
            header: 'Availability',
            cell: (row) => {
                const nextStatus = row.status === 'offline' ? 'available' : 'offline'
                return (
                    <Button
                        variant="outline"
                        size="sm"
                        disabled={isPending || row.status === 'in-transit'}
                        onClick={() => setAvailability({ id: row.id, status: nextStatus })}
                    >
                        {row.status === 'offline' ? 'Set Available' : 'Set Offline'}
                    </Button>
                )
            },
        },
        {
            key: 'expand',
            header: '',
            cell: (row) => {
                const isOpen = expandedId === row.id
                return (
                    <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2 text-xs text-[hsl(var(--foreground-muted))] hover:text-[hsl(var(--foreground))]"
                        onClick={(e) => { e.stopPropagation(); toggleExpanded(row.id) }}
                        aria-expanded={isOpen}
                    >
                        {isOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                        <span className="ml-1">Stats</span>
                    </Button>
                )
            },
        },
    ]

    return (
        <div className="flex flex-col gap-6 p-6">
            <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div>
                    <h1 className="text-xl font-semibold tracking-tight text-[hsl(var(--foreground))]">Drivers</h1>
                    <p className="text-xs text-[hsl(var(--foreground-muted))]">Manage driver availability.</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    <div className="flex flex-wrap items-center gap-1 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--surface))] px-3 py-2">
                        <span className="mr-1 text-xs text-[hsl(var(--foreground-muted))]">Status</span>
                        {STATUS_PILLS.map(({ value, label }) => (
                            <button
                                key={value}
                                type="button"
                                onClick={() => setStatusFilter(value)}
                                className={cn(
                                    'px-2.5 py-1 rounded-md border text-xs font-medium transition-colors',
                                    statusFilter === value
                                        ? value === 'available'
                                            ? 'border-green-500 bg-green-500/10 text-green-400'
                                            : value === 'offline'
                                              ? 'border-[hsl(var(--border-strong))] bg-[hsl(var(--surface-raised))] text-[hsl(var(--foreground-muted))]'
                                              : 'border-[hsl(var(--primary))] bg-[hsl(var(--primary)/0.12)] text-[hsl(var(--primary))]'
                                        : 'border-transparent text-[hsl(var(--foreground-muted))] hover:text-[hsl(var(--foreground))] hover:border-[hsl(var(--border))]',
                                )}
                            >
                                {label}
                            </button>
                        ))}
                    </div>
                    <div className="flex items-center gap-2 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--surface))] px-3 py-2">
                        <label className="text-xs text-[hsl(var(--foreground-muted))]">District</label>
                        <select
                            value={districtFilter}
                            onChange={(e) => setDistrictFilter(e.target.value)}
                            className="h-7 rounded-md border border-[hsl(var(--border))] bg-[hsl(var(--surface))] px-2 text-xs text-[hsl(var(--foreground))]"
                        >
                            <option value="all">All</option>
                            {MOCK_DISTRICTS.map((d) => (
                                <option key={d.id} value={d.id}>{d.name}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </header>

            <CursorTable
                columns={columns}
                rows={rows}
                getRowId={(row) => row.id}
                nextCursor={hasNextPage ? 'has-more' : null}
                isLoading={isLoading || isFetchingNextPage}
                onLoadMore={() => fetchNextPage()}
                emptyTitle={isLoading ? 'Loading...' : 'No drivers'}
                emptyDescription={isLoading ? '' : 'No drivers are currently available in the system.'}
                expandedId={expandedId}
                renderExpanded={(row) => <DriverPerformanceCard driverId={row.id} />}
            />
        </div>
    )
}
