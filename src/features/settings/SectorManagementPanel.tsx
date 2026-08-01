import { X } from 'lucide-react'
import { useUsers } from '@/lib/api/queries/useUsers'
import { useDistrictGroups } from '@/lib/api/queries/useDistrictGroups'
import { useUpdateUserSectors } from '@/lib/api/queries/useUpdateUserSectors'
import type { UserDto } from '@/types/api'
import { cn } from '@/lib/utils'

export function SectorManagementPanel() {
    const { data: users, isLoading: usersLoading } = useUsers()
    const { data: groups, isLoading: groupsLoading } = useDistrictGroups()
    const { mutate: updateSectors, isPending } = useUpdateUserSectors()

    if (usersLoading || groupsLoading) {
        return <p className="text-xs text-[hsl(var(--foreground-muted))]">Loading…</p>
    }

    const observers = (users ?? []).filter((u) => u.role !== 'GeneralObserver')
    const groupMap = Object.fromEntries((groups ?? []).map((g) => [g.id, g]))

    function addSector(user: UserDto, sectorId: string) {
        updateSectors({ userId: user.userId, sectorIds: [...user.sectorIds, sectorId] })
    }

    function removeSector(user: UserDto, sectorId: string) {
        updateSectors({ userId: user.userId, sectorIds: user.sectorIds.filter((s) => s !== sectorId) })
    }

    if (observers.length === 0) {
        return <p className="text-xs text-[hsl(var(--foreground-muted))]">No observer accounts found.</p>
    }

    return (
        <div className="space-y-3">
            {observers.map((user) => {
                const available = (groups ?? []).filter((g) => !user.sectorIds.includes(g.id))
                return (
                    <div
                        key={user.userId}
                        className="rounded-lg border border-[hsl(var(--border))] px-4 py-3 space-y-3"
                    >
                        <div className="flex items-center justify-between">
                            <p className="text-sm font-medium text-[hsl(var(--foreground))]">{user.username}</p>
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/15 text-amber-600 dark:text-amber-400">
                                {user.role}
                            </span>
                        </div>

                        <div className="flex flex-wrap gap-1.5 min-h-[1.5rem]">
                            {user.sectorIds.length === 0 ? (
                                <span className="text-xs text-[hsl(var(--foreground-muted))]">No sectors assigned</span>
                            ) : (
                                user.sectorIds.map((sid) => (
                                    <span
                                        key={sid}
                                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-[hsl(var(--primary)/0.12)] text-[hsl(var(--primary))]"
                                    >
                                        {groupMap[sid]?.name ?? sid}
                                        <button
                                            type="button"
                                            onClick={() => removeSector(user, sid)}
                                            disabled={isPending}
                                            className="hover:opacity-70 disabled:opacity-40 leading-none"
                                            aria-label={`Remove ${groupMap[sid]?.name ?? sid}`}
                                        >
                                            <X size={10} />
                                        </button>
                                    </span>
                                ))
                            )}
                        </div>

                        {available.length > 0 && (
                            <select
                                defaultValue=""
                                onChange={(e) => {
                                    if (e.target.value) {
                                        addSector(user, e.target.value)
                                        e.target.value = ''
                                    }
                                }}
                                disabled={isPending}
                                className={cn(
                                    'text-xs rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--surface))]',
                                    'text-[hsl(var(--foreground-muted))] px-2 py-1.5 disabled:opacity-50',
                                    'focus:outline-none focus:ring-1 focus:ring-[hsl(var(--primary))]',
                                )}
                            >
                                <option value="" disabled>Add sector…</option>
                                {available.map((g) => (
                                    <option key={g.id} value={g.id}>{g.name}</option>
                                ))}
                            </select>
                        )}
                    </div>
                )
            })}
        </div>
    )
}
