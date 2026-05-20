import { useMemo } from 'react'
import { Badge, Button } from '@/components/ui'
import CursorTable, { type CursorColumn } from '@/components/shared/CursorTable'
import { APP_CONFIG } from '@/config/app.config'
import { useDrivers } from '@/lib/api/queries/useDrivers'
import { useDriverAvailability } from '@/lib/api/queries/useDriverAvailability'
import type { DriverListItemDto } from '@/types/api'

export default function DriversPage() {
    const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } = useDrivers({
        pageSize: APP_CONFIG.table.driversPageSize,
    })

    const { mutate: setAvailability, isPending } = useDriverAvailability()

    const rows = useMemo(() => data?.pages.flatMap((p) => p.items) ?? [], [data])

    const columns: CursorColumn<DriverListItemDto>[] = [
        {
            key: 'name',
            header: 'Driver',
            cell: (row) => (
                <div>
                    <p className="font-medium">{row.name}</p>
                    <p className="text-xs text-[hsl(var(--foreground-muted))]">{row.id}</p>
                </div>
            ),
        },
        {
            key: 'district',
            header: 'District',
            cell: (row) => row.districtName,
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
            />
        </div>
    )
}
