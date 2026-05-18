import type { ReactNode } from 'react'
import { Button, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui'

export interface CursorColumn<T> {
    key: string
    header: ReactNode
    cell: (row: T) => ReactNode
    className?: string
}

interface CursorTableProps<T> {
    columns: CursorColumn<T>[]
    rows: T[]
    getRowId: (row: T) => string
    nextCursor?: string | null
    isLoading?: boolean
    onLoadMore?: () => void
    onRowClick?: (row: T) => void
    emptyTitle?: string
    emptyDescription?: string
}

export default function CursorTable<T>({
    columns,
    rows,
    getRowId,
    nextCursor,
    isLoading = false,
    onLoadMore,
    onRowClick,
    emptyTitle = 'No results',
    emptyDescription = 'Try adjusting the filters to see more results.',
}: CursorTableProps<T>) {
    return (
        <div className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--surface))]">
            <Table>
                <TableHeader>
                    <TableRow>
                        {columns.map((column) => (
                            <TableHead key={column.key} className={column.className}>
                                {column.header}
                            </TableHead>
                        ))}
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {rows.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={columns.length} className="py-10 text-center">
                                <p className="text-sm font-medium text-[hsl(var(--foreground))]">{emptyTitle}</p>
                                <p className="text-xs text-[hsl(var(--foreground-muted))]">{emptyDescription}</p>
                            </TableCell>
                        </TableRow>
                    ) : (
                        rows.map((row) => (
                            <TableRow
                                key={getRowId(row)}
                                className={onRowClick ? 'cursor-pointer' : undefined}
                                onClick={onRowClick ? () => onRowClick(row) : undefined}
                            >
                                {columns.map((column) => (
                                    <TableCell key={column.key} className={column.className}>
                                        {column.cell(row)}
                                    </TableCell>
                                ))}
                            </TableRow>
                        ))
                    )}
                </TableBody>
            </Table>
            {nextCursor && onLoadMore && (
                <div className="flex justify-center border-t border-[hsl(var(--border))] px-4 py-3">
                    <Button variant="outline" size="sm" onClick={onLoadMore} disabled={isLoading}>
                        {isLoading ? 'Loading...' : 'Load more'}
                    </Button>
                </div>
            )}
        </div>
    )
}
