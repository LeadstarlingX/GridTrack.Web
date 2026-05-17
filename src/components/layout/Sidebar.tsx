import { NavLink } from 'react-router-dom'
import { Radio, BarChart3, Package, Bell, Users, Settings, ChevronLeft, ChevronRight } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { useLiveStore } from '@/store/liveStore'

const navItems = [
    { to: '/', label: 'Live Ops', icon: Radio },
    { to: '/analytics', label: 'Analytics', icon: BarChart3 },
    { to: '/deliveries', label: 'Deliveries', icon: Package },
    { to: '/alerts', label: 'Alerts', icon: Bell },
    { to: '/drivers', label: 'Drivers', icon: Users, adminOnly: true },
    { to: '/settings', label: 'Settings', icon: Settings },
]

interface SidebarProps {
    isOpen: boolean
    onToggle: () => void
}

export default function Sidebar({ isOpen, onToggle }: SidebarProps) {
    const anomalyCount = useLiveStore((s) => s.anomalyQueue.length)

    return (
        <aside className="relative w-56 border-r border-border bg-card flex flex-col">
            <div className="h-14 flex items-center px-4 border-b border-border">
                <span className="font-bold text-lg">GridTrack</span>
            </div>
            <nav className="flex-1 p-2 space-y-1">
                {navItems.map((item) => (
                    <NavLink
                        key={item.to}
                        to={item.to}
                        end={item.to === '/'}
                        className={({ isActive }) =>
                            cn(
                                'flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors',
                                isActive
                                    ? 'bg-accent text-accent-foreground'
                                    : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                            )
                        }
                    >
                        <item.icon className="h-4 w-4" />
                        {item.label}
                        {item.label === 'Alerts' && anomalyCount > 0 && (
                            <Badge variant="destructive" className="ml-auto text-xs">
                                {anomalyCount}
                            </Badge>
                        )}
                    </NavLink>
                ))}
            </nav>
            <button
                type="button"
                onClick={onToggle}
                aria-label={isOpen ? 'Collapse navigation' : 'Expand navigation'}
                className="absolute top-1/2 -right-3 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-card shadow"
            >
                {isOpen ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </button>
        </aside>
    )
}