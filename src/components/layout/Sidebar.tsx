import { NavLink } from 'react-router-dom'
import { Radio, BarChart3, Package, Bell, Users, Settings } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { useLiveStore } from '@/store/liveStore'
import { useMapStore } from '@/store/mapStore'

const navItems = [
    { to: '/', label: 'Live Ops', icon: Radio },
    { to: '/analytics', label: 'Analytics', icon: BarChart3 },
    { to: '/deliveries', label: 'Deliveries', icon: Package },
    { to: '/alerts', label: 'Alerts', icon: Bell },
    { to: '/drivers', label: 'Drivers', icon: Users },
]

interface SidebarProps {
    isOpen: boolean
}

export default function Sidebar({ isOpen }: SidebarProps) {
    const anomalyCount = useLiveStore((s) => s.anomalyQueue.length)
    const hubStatus = useMapStore((s) => s.hubStatus)
    const drivers = useLiveStore((s) => s.drivers)
    const inTransitCount = Object.values(drivers).filter((d) => d.status === 'in-transit').length

    return (
        <aside
            className={cn(
                'fixed left-0 top-0 h-screen z-10 w-[240px]',
                'bg-[hsl(var(--map-overlay))] dark:bg-[hsl(var(--map-overlay-dark))]',
                'backdrop-blur-sm border-r border-[hsl(var(--border))] flex flex-col',
                'transition-transform duration-200 ease-out pointer-events-auto',
                isOpen ? 'translate-x-0' : '-translate-x-full'
            )}
        >
            {/* Brand */}
            <div className="flex items-center gap-2.5 px-4 h-14 border-b border-[hsl(var(--border))] shrink-0">
                <div className="w-7 h-7 rounded-[7px] bg-[hsl(var(--primary))] flex items-center justify-center text-[13px] font-extrabold text-white tracking-tight shrink-0">
                    GT
                </div>
                <span className="text-sm font-semibold tracking-tight text-[hsl(var(--foreground))]">GridTrack</span>
                <span className="ml-auto text-[10px] font-mono text-[hsl(var(--foreground-subtle,var(--foreground-muted)))]">v2</span>
            </div>

            {/* Nav */}
            <nav className="flex-1 overflow-y-auto py-2 px-2 flex flex-col gap-0.5">
                {navItems.map((item) => (
                    <NavLink
                        key={item.to}
                        to={item.to}
                        end={item.to === '/'}
                        className={({ isActive }) =>
                            cn(
                                'flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors duration-100 w-full',
                                isActive
                                    ? 'bg-[hsl(var(--primary)/0.15)] text-[hsl(var(--primary))]'
                                    : 'text-[hsl(var(--foreground-muted))] hover:bg-[hsl(var(--surface-raised))] hover:text-[hsl(var(--foreground))]'
                            )
                        }
                    >
                        <item.icon size={16} className="shrink-0" />
                        {item.label}
                        {item.label === 'Alerts' && anomalyCount > 0 && (
                            <Badge variant="destructive" className="ml-auto text-xs">
                                {anomalyCount}
                            </Badge>
                        )}
                    </NavLink>
                ))}
            </nav>

            {/* Settings link */}
            <div className="px-2 pb-1.5 shrink-0">
                <NavLink
                    to="/settings"
                    className={({ isActive }) =>
                        cn(
                            'flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors duration-100 w-full',
                            isActive
                                ? 'bg-[hsl(var(--primary)/0.15)] text-[hsl(var(--primary))]'
                                : 'text-[hsl(var(--foreground-muted))] hover:bg-[hsl(var(--surface-raised))] hover:text-[hsl(var(--foreground))]'
                        )
                    }
                >
                    <Settings size={16} className="shrink-0" />
                    Settings
                </NavLink>
            </div>

            {/* Connection status footer */}
            <div className="border-t border-[hsl(var(--border))] px-4 py-3 shrink-0">
                <div className="flex items-center gap-2">
                    <span className="relative flex h-2 w-2 shrink-0">
                        <span className={cn(
                            'animate-ping absolute inline-flex h-full w-full rounded-full opacity-75',
                            hubStatus === 'connected' ? 'bg-green-400' : hubStatus === 'reconnecting' ? 'bg-amber-400' : 'bg-red-400'
                        )} />
                        <span className={cn(
                            'relative inline-flex rounded-full h-2 w-2',
                            hubStatus === 'connected' ? 'bg-green-500' : hubStatus === 'reconnecting' ? 'bg-amber-500' : 'bg-red-500'
                        )} />
                    </span>
                    <span className="text-xs text-[hsl(var(--foreground-muted))]">
                        {hubStatus === 'connected' ? 'SignalR connected' : hubStatus === 'reconnecting' ? 'Reconnecting…' : 'Disconnected'}
                    </span>
                </div>
                <p className="mt-1 text-[11px] text-[hsl(var(--foreground-subtle,var(--foreground-muted)))] opacity-70">
                    {inTransitCount} {inTransitCount === 1 ? 'driver' : 'drivers'} in transit
                </p>
            </div>
        </aside>
    )
}
