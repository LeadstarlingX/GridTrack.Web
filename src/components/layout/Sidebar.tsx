import { NavLink } from 'react-router-dom'
import { Radio, BarChart3, Activity, Bot, Package, Bell, Users, Settings, XCircle } from 'lucide-react'
import * as Tooltip from '@radix-ui/react-tooltip'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { useLiveStore } from '@/store/liveStore'
import { useMapStore } from '@/store/mapStore'
import { PAGE_CONFIG } from '@/config/pages.config'
import { useAuthStore } from '@/store/authStore'

const NAV_GROUPS = [
    {
        label: 'Operations',
        items: [
            { to: '/', label: 'Live Ops', icon: Radio, pageKey: 'liveOps' as const },
        ],
    },
    {
        label: 'Data',
        items: [
            { to: '/analytics',    label: 'Analytics',    icon: BarChart3, pageKey: 'analytics'  as const },
            { to: '/performance',  label: 'Performance',  icon: Activity,  pageKey: 'analytics'  as const },
            { to: '/drivers',      label: 'Drivers',      icon: Users,     pageKey: 'drivers'    as const },
            { to: '/deliveries',   label: 'Deliveries',   icon: Package,   pageKey: 'deliveries' as const },
            { to: '/cancelled',    label: 'Cancelled',    icon: XCircle,   pageKey: 'cancelled'  as const },
        ],
    },
    {
        label: 'Intelligence',
        items: [
            { to: '/assistant', label: 'AI Assistant', icon: Bot,  pageKey: 'analytics' as const },
            { to: '/alerts',    label: 'Alerts',       icon: Bell, pageKey: 'alerts'    as const },
        ],
    },
] as const

interface SidebarProps {
    isOpen: boolean
}

function NavIcon({
                     item,
                     anomalyCount,
                 }: {
    item: { to: string; label: string; icon: React.ComponentType<{ size?: number }> }
    anomalyCount: number
}) {
    return (
        <Tooltip.Root>
            <Tooltip.Trigger asChild>
                <NavLink
                    to={item.to}
                    end={item.to === '/'}
                    className={({ isActive }) =>
                        cn(
                            'relative flex h-9 w-9 items-center justify-center rounded-lg transition-colors duration-150',
                            isActive
                                ? 'bg-[hsl(var(--primary)/0.15)] text-[hsl(var(--primary))]'
                                : 'text-[hsl(var(--foreground-muted))] hover:bg-[hsl(var(--surface-raised))] hover:text-[hsl(var(--foreground))]',
                        )
                    }
                >
                    <item.icon size={16} />
                    {item.label === 'Alerts' && anomalyCount > 0 && (
                        <span className="absolute -top-0.5 -right-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-[hsl(var(--destructive))] text-[8px] font-bold text-[hsl(var(--primary-foreground))]">
                            {anomalyCount > 9 ? '9+' : anomalyCount}
                        </span>
                    )}
                </NavLink>
            </Tooltip.Trigger>
            <Tooltip.Portal>
                <Tooltip.Content
                    side="right"
                    sideOffset={10}
                    className="z-[100] rounded-md bg-[hsl(var(--foreground))] px-2.5 py-1.5 text-xs font-medium text-[hsl(var(--background))] shadow-lg"
                >
                    {item.label}
                    <Tooltip.Arrow className="fill-[hsl(var(--foreground))]" />
                </Tooltip.Content>
            </Tooltip.Portal>
        </Tooltip.Root>
    )
}

export default function Sidebar({ isOpen }: SidebarProps) {
    const anomalyCount = useLiveStore((s) => s.anomalyQueue.length)
    const hubStatus    = useMapStore((s) => s.hubStatus)
    const drivers      = useLiveStore((s) => s.drivers)
    const inTransitCount = Object.values(drivers).filter((d) => d.status === 'in-transit').length
    const role = useAuthStore((s) => s.role)

    const visibleGroups = NAV_GROUPS.map((group) => ({
        ...group,
        items: group.items.filter((item) => PAGE_CONFIG[item.pageKey]),
    })).filter((group) => group.items.length > 0)

    const allVisibleItems = visibleGroups.flatMap((g) => g.items)

    const hubDotClass = hubStatus === 'connected'
        ? 'bg-emerald-500'
        : hubStatus === 'reconnecting'
            ? 'bg-amber-500'
            : 'bg-red-500'

    const hubPingClass = hubStatus === 'connected'
        ? 'bg-emerald-400'
        : hubStatus === 'reconnecting'
            ? 'bg-amber-400'
            : 'bg-red-400'

    const hubText = hubStatus === 'connected'
        ? 'Connected'
        : hubStatus === 'reconnecting'
            ? 'Reconnecting…'
            : 'Disconnected'

    /* ── COLLAPSED: icon-only strip ──────────────────────── */
    if (!isOpen) {
        return (
            <aside className="fixed left-0 top-0 h-screen z-10 w-14 bg-[hsl(var(--surface))] border-r border-[hsl(var(--border))] flex flex-col pointer-events-auto">
                <Tooltip.Provider delayDuration={200}>
                    {/* Brand mark */}
                    <div className="flex h-14 items-center justify-center border-b border-[hsl(var(--border))] shrink-0">
                        <div className="w-8 h-8 rounded-[8px] bg-[hsl(var(--primary))] flex items-center justify-center text-[11px] font-extrabold text-[hsl(var(--primary-foreground))] tracking-tight">
                            GT
                        </div>
                    </div>

                    {/* Nav icons */}
                    <nav className="flex-1 overflow-y-auto py-3 flex flex-col items-center gap-1 px-1">
                        {allVisibleItems.map((item) => (
                            <NavIcon key={item.to} item={item} anomalyCount={anomalyCount} />
                        ))}
                    </nav>

                    {/* Settings icon */}
                    {PAGE_CONFIG.settings && (
                        <div className="pb-2 flex justify-center px-1 shrink-0">
                            <Tooltip.Root>
                                <Tooltip.Trigger asChild>
                                    <NavLink
                                        to="/settings"
                                        className={({ isActive }) =>
                                            cn(
                                                'flex h-9 w-9 items-center justify-center rounded-lg transition-colors duration-150',
                                                isActive
                                                    ? 'bg-[hsl(var(--primary)/0.15)] text-[hsl(var(--primary))]'
                                                    : 'text-[hsl(var(--foreground-muted))] hover:bg-[hsl(var(--surface-raised))] hover:text-[hsl(var(--foreground))]',
                                            )
                                        }
                                    >
                                        <Settings size={16} />
                                    </NavLink>
                                </Tooltip.Trigger>
                                <Tooltip.Portal>
                                    <Tooltip.Content
                                        side="right"
                                        sideOffset={10}
                                        className="z-[100] rounded-md bg-[hsl(var(--foreground))] px-2.5 py-1.5 text-xs font-medium text-[hsl(var(--background))] shadow-lg"
                                    >
                                        Settings
                                        <Tooltip.Arrow className="fill-[hsl(var(--foreground))]" />
                                    </Tooltip.Content>
                                </Tooltip.Portal>
                            </Tooltip.Root>
                        </div>
                    )}

                    {/* Status indicator dot */}
                    <div className="border-t border-[hsl(var(--border))] py-3 flex justify-center shrink-0">
                        <Tooltip.Root>
                            <Tooltip.Trigger asChild>
                                <span className="relative flex h-2.5 w-2.5 cursor-default">
                                    <span className={cn('animate-ping absolute inline-flex h-full w-full rounded-full opacity-75', hubPingClass)} />
                                    <span className={cn('relative inline-flex rounded-full h-2.5 w-2.5', hubDotClass)} />
                                </span>
                            </Tooltip.Trigger>
                            <Tooltip.Portal>
                                <Tooltip.Content
                                    side="right"
                                    sideOffset={10}
                                    className="z-[100] rounded-md bg-[hsl(var(--foreground))] px-2.5 py-1.5 text-xs font-medium text-[hsl(var(--background))] shadow-lg"
                                >
                                    {hubText}
                                    <Tooltip.Arrow className="fill-[hsl(var(--foreground))]" />
                                </Tooltip.Content>
                            </Tooltip.Portal>
                        </Tooltip.Root>
                    </div>
                </Tooltip.Provider>
            </aside>
        )
    }

    /* ── EXPANDED: full sidebar ───────────────────────────── */
    return (
        <aside className="fixed left-0 top-0 h-screen z-10 w-[240px] bg-[hsl(var(--surface))] border-r border-[hsl(var(--border))] flex flex-col pointer-events-auto">
            {/* Brand */}
            <div className="flex items-center gap-2.5 px-4 h-14 border-b border-[hsl(var(--border))] shrink-0">
                <div className="w-8 h-8 rounded-[8px] bg-[hsl(var(--primary))] flex items-center justify-center text-[11px] font-extrabold text-[hsl(var(--primary-foreground))] tracking-tight shrink-0">
                    GT
                </div>
                <span className="text-sm font-semibold tracking-tight text-[hsl(var(--foreground))]">GridTrack</span>
                {role && (
                    <span className={cn(
                        'ml-auto text-[9px] font-semibold px-2 py-0.5 rounded-full whitespace-nowrap',
                        role === 'GeneralObserver'
                            ? 'bg-[hsl(var(--primary)/0.12)] text-[hsl(var(--primary))]'
                            : 'bg-amber-500/15 text-amber-500',
                    )}>
                        {role === 'GeneralObserver' ? 'Admin' : 'Observer'}
                    </span>
                )}
            </div>

            {/* Grouped nav */}
            <nav className="flex-1 overflow-y-auto py-3 px-2 flex flex-col gap-4">
                {visibleGroups.map((group) => (
                    <div key={group.label} className="flex flex-col gap-0.5">
                        <p className="px-3 mb-1 text-[9px] font-semibold uppercase tracking-widest text-[hsl(var(--foreground-subtle,var(--foreground-muted)))]">
                            {group.label}
                        </p>
                        {group.items.map((item) => (
                            <NavLink
                                key={item.to}
                                to={item.to}
                                end={item.to === '/'}
                                className={({ isActive }) =>
                                    cn(
                                        'relative flex items-center gap-3 py-2 rounded-lg text-sm transition-colors duration-150 w-full',
                                        'border-l-[3px] pl-[9px] pr-3',
                                        isActive
                                            ? 'border-[hsl(var(--primary))] bg-[hsl(var(--primary)/0.1)] text-[hsl(var(--primary))]'
                                            : 'border-transparent text-[hsl(var(--foreground-muted))] hover:bg-[hsl(var(--surface-raised))] hover:text-[hsl(var(--foreground))]',
                                    )
                                }
                            >
                                <item.icon size={15} className="shrink-0" />
                                {item.label}
                                {item.label === 'Alerts' && anomalyCount > 0 && (
                                    <Badge variant="destructive" className="ml-auto text-[10px] py-0 px-1.5 h-4 min-w-4 justify-center">
                                        {anomalyCount}
                                    </Badge>
                                )}
                            </NavLink>
                        ))}
                    </div>
                ))}
            </nav>

            {/* Settings link */}
            {PAGE_CONFIG.settings && (
                <div className="px-2 pb-2 shrink-0">
                    <NavLink
                        to="/settings"
                        className={({ isActive }) =>
                            cn(
                                'relative flex items-center gap-3 py-2 rounded-lg text-sm transition-colors duration-150 w-full',
                                'border-l-[3px] pl-[9px] pr-3',
                                isActive
                                    ? 'border-[hsl(var(--primary))] bg-[hsl(var(--primary)/0.1)] text-[hsl(var(--primary))]'
                                    : 'border-transparent text-[hsl(var(--foreground-muted))] hover:bg-[hsl(var(--surface-raised))] hover:text-[hsl(var(--foreground))]',
                            )
                        }
                    >
                        <Settings size={15} className="shrink-0" />
                        Settings
                    </NavLink>
                </div>
            )}

            {/* Connection status footer */}
            <div className="border-t border-[hsl(var(--border))] px-3 py-3 shrink-0">
                <div className="rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--surface-raised))] px-3 py-2.5">
                    <div className="flex items-center gap-2.5">
                        <span className="relative flex h-2 w-2 shrink-0">
                            <span className={cn('animate-ping absolute inline-flex h-full w-full rounded-full opacity-75', hubPingClass)} />
                            <span className={cn('relative inline-flex rounded-full h-2 w-2', hubDotClass)} />
                        </span>
                        <span className="text-xs font-medium text-[hsl(var(--foreground))]">
                            {hubText}
                        </span>
                    </div>
                    <p className="mt-1.5 text-[11px] text-[hsl(var(--foreground-muted))]">
                        {inTransitCount} {inTransitCount === 1 ? 'driver' : 'drivers'} in transit
                    </p>
                </div>
            </div>
        </aside>
    )
}
