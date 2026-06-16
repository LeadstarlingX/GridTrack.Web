import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { APP_CONFIG } from '@/config/app.config'
import Sidebar from './Sidebar'
import { cn } from '@/lib/utils'
import { useAnomalyToasts } from '@/hooks/useAnomalyToasts'
import { useKeepAlive } from '@/hooks/useKeepAlive'
import { useSignalR } from '@/hooks/useSignalR'
import { useRealLiveState } from '@/hooks/useRealLiveState'

export default function AppShell() {
    const [navOpen, setNavOpen] = useState<boolean>(APP_CONFIG.layout.sidebarOpenDefault)
    useAnomalyToasts()
    useKeepAlive()
    useSignalR()
    useRealLiveState()

    return (
        <div id="ui-shell" className="relative z-10 flex h-screen w-screen overflow-hidden pointer-events-none">
            <Sidebar isOpen={navOpen} />
            <button
                type="button"
                onClick={() => setNavOpen((v) => !v)}
                aria-label="Toggle navigation"
                aria-expanded={navOpen}
                className="fixed left-0 top-1/2 -translate-y-1/2 z-20 flex h-10 w-7 items-center justify-center bg-[hsl(var(--surface))] border border-[hsl(var(--border))] border-l-0 rounded-r-md shadow-sm text-[hsl(var(--foreground-muted))] hover:text-[hsl(var(--foreground))] transition-colors duration-150 pointer-events-auto"
            >
                {navOpen ? <ChevronLeft size={14} /> : <ChevronRight size={14} />}
            </button>
            <main id="main-content" className={cn(
                'pointer-events-auto flex-1 overflow-y-auto bg-[hsl(var(--background))] text-[hsl(var(--foreground))]',
                'transition-[margin] duration-200 ease-out',
                navOpen ? 'ml-[240px]' : 'ml-0'
            )}>
                <Outlet />
            </main>
        </div>
    )
}