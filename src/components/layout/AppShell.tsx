import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import { cn } from '@/lib/utils'

export default function AppShell() {
    const [navOpen, setNavOpen] = useState(true)

    return (
        <div className="relative h-screen overflow-hidden">
            <div
                className={cn(
                    'fixed inset-y-0 left-0 z-[1500] w-56 border-r border-border bg-card transition-transform duration-200',
                    navOpen ? 'translate-x-0' : '-translate-x-full'
                )}
            >
                <Sidebar isOpen={navOpen} onToggle={() => setNavOpen((v) => !v)} />
            </div>
            <main
                className={cn(
                    'h-full overflow-auto bg-background transition-[margin] duration-200',
                    navOpen ? 'ml-56' : 'ml-0'
                )}
            >
                <Outlet />
            </main>
        </div>
    )
}