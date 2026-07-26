import { Fragment, type ReactNode } from 'react'
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
    expandedId?: string | null
    renderExpanded?: (row: T) => ReactNode
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
                                           expandedId,
                                           renderExpanded,
                                       }: CursorTableProps<T>) {
    return (
        <div className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--surface))] overflow-hidden">
            <Table>
                <TableHeader>
                    <TableRow className="sticky top-0 z-10 bg-[hsl(var(--surface))] shadow-sm">
                        {columns.map((column) => (
                            <TableHead
                                key={column.key}
                                className={`py-3 px-4 text-xs font-medium uppercase tracking-wider text-[hsl(var(--foreground-muted))] ${column.className ?? ''}`}
                            >
                                {column.header}
                            </TableHead>
                        ))}
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {rows.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={columns.length} className="py-12 text-center">
                                <p className="text-sm font-medium text-[hsl(var(--foreground))]">{emptyTitle}</p>
                                <p className="mt-1 text-xs text-[hsl(var(--foreground-muted))]">{emptyDescription}</p>
                            </TableCell>
                        </TableRow>
                    ) : (
                        rows.map((row) => {
                            const id = getRowId(row)
                            const isExpanded = expandedId === id
                            return (
                                <Fragment key={id}>
                                    <TableRow
                                        className={`transition-colors duration-100 hover:bg-[hsl(var(--surface-raised))] ${onRowClick ? 'cursor-pointer' : ''}`}
                                        onClick={onRowClick ? () => onRowClick(row) : undefined}
                                    >
                                        {columns.map((column) => (
                                            <TableCell key={column.key} className={`py-3 px-4 ${column.className ?? ''}`}>
                                                {column.cell(row)}
                                            </TableCell>
                                        ))}
                                    </TableRow>
                                    {isExpanded && renderExpanded && (
                                        <TableRow>
                                            <TableCell colSpan={columns.length} className="bg-[hsl(var(--surface-raised))] p-0">
                                                {renderExpanded(row)}
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </Fragment>
                            )
                        })
                    )}
                </TableBody>
            </Table>
            {nextCursor && onLoadMore && (
                <div className="flex justify-center border-t border-[hsl(var(--border))] px-4 py-3">
                    <Button variant="outline" size="sm" onClick={onLoadMore} disabled={isLoading}>
                        {isLoading ? 'Loading…' : 'Load more'}
                    </Button>
                </div>
            )}
        </div>
    )
}
