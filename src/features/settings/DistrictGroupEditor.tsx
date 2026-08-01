import { useState } from 'react'
import { Search } from 'lucide-react'
import { useDistricts } from '@/lib/api/queries/useDistricts'
import { useCreateDistrictGroup, useUpdateDistrictGroup } from '@/lib/api/queries/useDistrictGroupMutations'
import { Button } from '@/components/ui/button'
import type { DistrictGroupDto } from '@/types/api'

interface Props {
    group: DistrictGroupDto | null  // null = create mode
    onClose: () => void
}

export function DistrictGroupEditor({ group, onClose }: Props) {
    const { data: allDistricts = [], isLoading: districtsLoading } = useDistricts()
    const create = useCreateDistrictGroup()
    const update = useUpdateDistrictGroup()

    const [name, setName] = useState(group?.name ?? '')
    const [selectedIds, setSelectedIds] = useState<string[]>(group?.districtIds ?? [])
    const [leftSearch, setLeftSearch] = useState('')
    const [rightSearch, setRightSearch] = useState('')

    const isPending = create.isPending || update.isPending

    const available = allDistricts.filter(
        (d) => !selectedIds.includes(d.id) && d.name.toLowerCase().includes(leftSearch.toLowerCase()),
    )
    const assigned = allDistricts.filter(
        (d) => selectedIds.includes(d.id) && d.name.toLowerCase().includes(rightSearch.toLowerCase()),
    )

    const canSave = name.trim().length > 0 && selectedIds.length > 0 && !isPending

    async function handleSave() {
        if (!canSave) return
        const body = { name: name.trim(), districtIds: selectedIds }
        if (group) {
            await update.mutateAsync({ id: group.id, ...body })
        } else {
            await create.mutateAsync(body)
        }
        onClose()
    }

    if (districtsLoading) {
        return <p className="text-xs text-[hsl(var(--foreground-muted))]">Loading districts…</p>
    }

    return (
        <div className="space-y-4">
            {/* Name */}
            <div>
                <label className="block text-xs font-medium text-[hsl(var(--foreground-muted))] mb-1">
                    Sector name
                </label>
                <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. North Zone"
                    className="w-full rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--surface))] px-3 py-2 text-sm text-[hsl(var(--foreground))] placeholder:text-[hsl(var(--foreground-muted))] focus:outline-none focus:ring-1 focus:ring-[hsl(var(--primary))]"
                />
            </div>

            {/* Transfer list */}
            <div className="grid grid-cols-2 gap-3">
                <Column
                    heading={`Available (${allDistricts.length - selectedIds.length})`}
                    search={leftSearch}
                    onSearch={setLeftSearch}
                    items={available}
                    emptyFull="All districts assigned"
                    emptySearch="No match"
                    onClickItem={(id) => setSelectedIds((p) => [...p, id])}
                    hoverClass="hover:bg-[hsl(var(--primary)/0.08)]"
                />
                <Column
                    heading={`Assigned (${selectedIds.length})`}
                    search={rightSearch}
                    onSearch={setRightSearch}
                    items={assigned}
                    emptyFull="No districts assigned"
                    emptySearch="No match"
                    onClickItem={(id) => setSelectedIds((p) => p.filter((x) => x !== id))}
                    hoverClass="hover:bg-red-500/10"
                />
            </div>

            {selectedIds.length === 0 && (
                <p className="text-xs text-amber-500">At least one district must be assigned.</p>
            )}

            {/* Footer */}
            <div className="flex justify-end gap-2 pt-2 border-t border-[hsl(var(--border))]">
                <Button variant="outline" size="sm" onClick={onClose}>
                    Cancel
                </Button>
                <Button size="sm" disabled={!canSave} onClick={handleSave}>
                    {isPending ? 'Saving…' : group ? 'Update sector' : 'Create sector'}
                </Button>
            </div>
        </div>
    )
}

function Column({
    heading,
    search,
    onSearch,
    items,
    emptyFull,
    emptySearch,
    onClickItem,
    hoverClass,
}: {
    heading: string
    search: string
    onSearch: (v: string) => void
    items: { id: string; name: string }[]
    emptyFull: string
    emptySearch: string
    onClickItem: (id: string) => void
    hoverClass: string
}) {
    return (
        <div className="flex flex-col gap-2">
            <p className="text-xs font-medium text-[hsl(var(--foreground-muted))]">{heading}</p>
            <div className="relative">
                <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[hsl(var(--foreground-muted))]" />
                <input
                    type="text"
                    value={search}
                    onChange={(e) => onSearch(e.target.value)}
                    placeholder="Search…"
                    className="w-full rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--surface))] pl-7 pr-3 py-1.5 text-xs text-[hsl(var(--foreground))] placeholder:text-[hsl(var(--foreground-muted))] focus:outline-none focus:ring-1 focus:ring-[hsl(var(--primary))]"
                />
            </div>
            <div className="rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--surface-raised))] overflow-y-auto max-h-56">
                {items.length === 0 ? (
                    <p className="text-xs text-[hsl(var(--foreground-muted))] p-3">
                        {search ? emptySearch : emptyFull}
                    </p>
                ) : (
                    items.map((d) => (
                        <button
                            key={d.id}
                            type="button"
                            onClick={() => onClickItem(d.id)}
                            className={`w-full text-left px-3 py-2 text-xs text-[hsl(var(--foreground))] border-b border-[hsl(var(--border))] last:border-0 transition-colors ${hoverClass}`}
                        >
                            {d.name}
                        </button>
                    ))
                )}
            </div>
        </div>
    )
}
