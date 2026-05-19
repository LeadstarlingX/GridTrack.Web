import { NavLink } from 'react-router-dom'
import { Radio, BarChart3, Package, Bell, Users, Settings, Grid3X3 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { useLiveStore } from '@/store/liveStore'
import { useMapStore } from '@/store/mapStore'

const navItems = [
    { to: '/', label: 'Live Ops', icon: Radio },
    { to: '/', label: 'Districts', icon: Grid3X3, openDistricts: true },
    { to: '/analytics', label: 'Analytics', icon: BarChart3 },
    { to: '/deliveries', label: 'Deliveries', icon: Package },
    { to: '/alerts', label: 'Alerts', icon: Bell },
    { to: '/drivers', label: 'Drivers', icon: Users, adminOnly: true },
]

interface SidebarProps {
    isOpen: boolean
}

export default function Sidebar({ isOpen }: SidebarProps) {
    const anomalyCount = useLiveStore((s) => s.anomalyQueue.length)
    const setSidePanelMode = useMapStore((s) => s.setSidePanelMode)
    const setDistrictPanelView = useMapStore((s) => s.setDistrictPanelView)

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
            <div className="flex items-center gap-2 px-4 h-14 border-b border-[hsl(var(--border))] shrink-0">
                <span className="text-sm font-semibold tracking-tight text-[hsl(var(--foreground))]">GridTrack</span>
            </div>
            <nav className="flex-1 overflow-y-auto py-3 px-2 flex flex-col gap-0.5">
                {navItems.map((item) => (
                    <NavLink
                        key={item.to}
                        to={item.to}
                        end={item.to === '/'}
                        onClick={() => {
                            if (item.openDistricts) {
                                setSidePanelMode('district')
                                setDistrictPanelView('browse')
                            }
                        }}
                        className={({ isActive }) =>
                            cn(
                                'flex items-center gap-3 px-3 py-2 rounded text-sm transition-colors duration-100 w-full',
                                isActive
                                    ? 'bg-[hsl(var(--surface-raised))] text-[hsl(var(--foreground))]'
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
            <div className="border-t border-[hsl(var(--border))] px-2 py-3">
                <NavLink
                    to="/settings"
                    className={({ isActive }) =>
                        cn(
                            'flex items-center gap-3 px-3 py-2 rounded text-sm transition-colors duration-100 w-full',
                            isActive
                                ? 'bg-[hsl(var(--surface-raised))] text-[hsl(var(--foreground))]'
                                : 'text-[hsl(var(--foreground-muted))] hover:bg-[hsl(var(--surface-raised))] hover:text-[hsl(var(--foreground))]'
                        )
                    }
                >
                    <Settings size={16} className="shrink-0" />
                    Settings
                </NavLink>
            </div>
        </aside>
    )
}