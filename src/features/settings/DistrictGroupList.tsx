import { useState } from 'react'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import { useDistrictGroups } from '@/lib/api/queries/useDistrictGroups'
import { useDeleteDistrictGroup } from '@/lib/api/queries/useDistrictGroupMutations'
import { DistrictGroupEditor } from './DistrictGroupEditor'
import { Button } from '@/components/ui/button'
import type { DistrictGroupDto } from '@/types/api'

export function DistrictGroupList() {
    const { data: groups, isLoading } = useDistrictGroups()
    const { mutate: deleteGroup, isPending: deleting } = useDeleteDistrictGroup()

    // undefined = list view, null = create, DistrictGroupDto = edit
    const [target, setTarget] = useState<DistrictGroupDto | null | undefined>(undefined)

    if (target !== undefined) {
        return <DistrictGroupEditor group={target} onClose={() => setTarget(undefined)} />
    }

    if (isLoading) {
        return (
            <div className="space-y-2 animate-pulse">
                {[1, 2, 3].map((i) => (
                    <div key={i} className="h-14 rounded-lg bg-[hsl(var(--surface-raised))]" />
                ))}
            </div>
        )
    }

    return (
        <div className="space-y-3">
            <div className="flex justify-end">
                <Button size="sm" onClick={() => setTarget(null)}>
                    <Plus />
                    Create sector
                </Button>
            </div>

            {!groups || groups.length === 0 ? (
                <p className="text-xs text-[hsl(var(--foreground-muted))]">
                    No sectors defined. Create one to group districts.
                </p>
            ) : (
                <div className="space-y-2">
                    {groups.map((g) => (
                        <div
                            key={g.id}
                            className="flex items-center justify-between rounded-lg border border-[hsl(var(--border))] px-4 py-3"
                        >
                            <div>
                                <p className="text-sm font-medium text-[hsl(var(--foreground))]">{g.name}</p>
                                <p className="text-xs text-[hsl(var(--foreground-muted))] mt-0.5">
                                    {g.districtIds.length} district{g.districtIds.length !== 1 ? 's' : ''}
                                </p>
                            </div>
                            <div className="flex items-center gap-1">
                                <Button
                                    variant="ghost"
                                    size="icon-sm"
                                    onClick={() => setTarget(g)}
                                    aria-label={`Edit ${g.name}`}
                                >
                                    <Pencil />
                                </Button>
                                <Button
                                    variant="destructive"
                                    size="icon-sm"
                                    disabled={deleting}
                                    onClick={() => {
                                        if (window.confirm(`Delete sector "${g.name}"?`)) {
                                            deleteGroup(g.id)
                                        }
                                    }}
                                    aria-label={`Delete ${g.name}`}
                                >
                                    <Trash2 />
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
