import { useMemo, useState } from 'react'
import { Badge, Button, toast } from '@/components/ui'
import CursorTable, { type CursorColumn } from '@/components/shared/CursorTable'
import { useLiveStore } from '@/store/liveStore'
import { MOCK_DISTRICTS } from '@/constants/mockData'
import type { DriverState } from '@/types/driver'

export default function DriversPage() {
    const driversById = useLiveStore((s) => s.drivers)
    const [visibleCount, setVisibleCount] = useState(8)

    const districtNameById = useMemo(() => {
        return Object.fromEntries(MOCK_DISTRICTS.map((district) => [district.id, district.name]))
    }, [])

    const drivers = useMemo(() => Object.values(driversById), [driversById])

    const rows = drivers
        .slice()
        .sort((a, b) => a.name.localeCompare(b.name))
        .slice(0, visibleCount)

    const nextCursor = visibleCount < drivers.length ? `cursor-${visibleCount}` : null

    const columns: CursorColumn<DriverState>[] = [
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
            cell: (row) => districtNameById[row.districtId] ?? row.districtId,
        },
        {
            key: 'status',
            header: 'Status',
            cell: (row) => {
                const variant = row.status === 'in-transit' ? 'default' : row.status === 'available' ? 'secondary' : 'outline'
                return <Badge variant={variant}>{row.status}</Badge>
            },
        },
        {
            key: 'action',
            header: 'Availability',
            cell: (row) => (
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                        toast.message('Availability updates are not wired yet.', {
                            description: `Driver ${row.name} (${row.id})`,
                        })
                    }
                >
                    Toggle
                </Button>
            ),
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
                nextCursor={nextCursor}
                onLoadMore={() => setVisibleCount((prev) => prev + 8)}
                emptyTitle="No drivers"
                emptyDescription="No drivers are currently available in the system."
            />
        </div>
    )
}