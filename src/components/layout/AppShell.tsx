import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { Menu, Sun, Moon } from 'lucide-react'
import { useTheme } from 'next-themes'
import { APP_CONFIG } from '@/config/app.config'
import Sidebar from './Sidebar'
import { cn } from '@/lib/utils'
import { useAnomalyToasts } from '@/hooks/useAnomalyToasts'
import { useKeepAlive } from '@/hooks/useKeepAlive'
import { useSignalR } from '@/hooks/useSignalR'
import { useRealLiveState } from '@/hooks/useRealLiveState'
import { useAuthStore } from '@/store/authStore'

function ThemeToggle() {
    const { theme, setTheme } = useTheme()
    return (
        <button
            type="button"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            aria-label="Toggle theme"
            className="flex h-7 w-7 items-center justify-center rounded-md text-[hsl(var(--foreground-muted))] hover:text-[hsl(var(--foreground))] hover:bg-[hsl(var(--surface-raised))] transition-colors duration-150"
        >
            <Sun size={14} className="dark:hidden" />
            <Moon size={14} className="hidden dark:block" />
        </button>
    )
}

export default function AppShell() {
    const [navOpen, setNavOpen] = useState<boolean>(APP_CONFIG.layout.sidebarOpenDefault)
    const role = useAuthStore((s) => s.role)

    useAnomalyToasts()
    useKeepAlive()
    useSignalR()
    useRealLiveState()

    return (
        <div id="ui-shell" className="relative z-10 flex h-screen w-screen overflow-hidden pointer-events-none">
            <Sidebar isOpen={navOpen} />

            {/* Right-side column: header bar + main content */}
            <div
                className={cn(
                    'flex flex-col flex-1 min-w-0 pointer-events-none',
                    'transition-[margin-left] duration-200 ease-out',
                    navOpen ? 'ml-[240px]' : 'ml-14',
                )}
            >
                {/* Top header bar */}
                <header
                    className={cn(
                        'h-10 shrink-0 flex items-center gap-2 px-3',
                        'bg-[hsl(var(--map-overlay))] dark:bg-[hsl(var(--map-overlay-dark))]',
                        'backdrop-blur-sm border-b border-[hsl(var(--border))]',
                        'pointer-events-auto',
                    )}
                >
                    {/* Hamburger / toggle */}
                    <button
                        type="button"
                        onClick={() => setNavOpen((v) => !v)}
                        aria-label="Toggle navigation"
                        aria-expanded={navOpen}
                        className="flex h-7 w-7 items-center justify-center rounded-md text-[hsl(var(--foreground-muted))] hover:text-[hsl(var(--foreground))] hover:bg-[hsl(var(--surface-raised))] transition-colors duration-150"
                    >
                        <Menu size={15} />
                    </button>

                    {/* Wordmark — visible only when sidebar is collapsed */}
                    {!navOpen && (
                        <span className="text-sm font-semibold tracking-tight text-[hsl(var(--foreground))]">
                            GridTrack
                        </span>
                    )}

                    <div className="ml-auto flex items-center gap-1.5">
                        <ThemeToggle />
                        {role && (
                            <span className={cn(
                                'text-[9px] font-semibold px-2 py-0.5 rounded-full whitespace-nowrap',
                                role === 'GeneralObserver'
                                    ? 'bg-[hsl(var(--primary)/0.12)] text-[hsl(var(--primary))]'
                                    : 'bg-amber-500/15 text-amber-500',
                            )}>
                                {role === 'GeneralObserver' ? 'Admin' : 'Observer'}
                            </span>
                        )}
                    </div>
                </header>

                {/* Main content */}
                <main
                    id="main-content"
                    className="pointer-events-auto flex-1 overflow-y-auto bg-[hsl(var(--background))] text-[hsl(var(--foreground))]"
                >
                    <Outlet />
                </main>
            </div>
        </div>
    )
}
