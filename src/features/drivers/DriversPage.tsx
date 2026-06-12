import { useMemo, useState } from 'react'
import { Badge, Button } from '@/components/ui'
import CursorTable, { type CursorColumn } from '@/components/shared/CursorTable'
import { APP_CONFIG } from '@/config/app.config'
import { useDrivers } from '@/lib/api/queries/useDrivers'
import { useDriverAvailability } from '@/lib/api/queries/useDriverAvailability'
import type { DriverListItemDto } from '@/types/api'
import DriverPerformanceCard from './DriverPerformanceCard'
import { Car, ChevronDown, ChevronUp, Phone } from 'lucide-react'

export default function DriversPage() {
    const [expandedId, setExpandedId] = useState<string | null>(null)

    const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } = useDrivers({
        pageSize: APP_CONFIG.table.driversPageSize,
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
            <header>
                <h1 className="text-xl font-semibold tracking-tight text-[hsl(var(--foreground))]">Drivers</h1>
                <p className="text-xs text-[hsl(var(--foreground-muted))]">Manage driver availability.</p>
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
