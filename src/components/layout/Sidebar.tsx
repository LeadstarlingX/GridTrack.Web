import { NavLink } from 'react-router-dom'
import { Radio, BarChart3, Package, Bell, Users } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

const navItems = [
    { to: '/', label: 'Live Ops', icon: Radio },
    { to: '/analytics', label: 'Analytics', icon: BarChart3 },
    { to: '/deliveries', label: 'Deliveries', icon: Package },
    { to: '/alerts', label: 'Alerts', icon: Bell, badge: 0 },
    { to: '/drivers', label: 'Drivers', icon: Users, adminOnly: true },
]

export default function Sidebar() {
    return (
        <aside className="w-56 border-r border-border bg-card flex flex-col">
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
                        {item.badge !== undefined && item.badge > 0 && (
                            <Badge variant="destructive" className="ml-auto text-xs">
                                {item.badge}
                            </Badge>
                        )}
                    </NavLink>
                ))}
            </nav>
        </aside>
    )
}