import type { ReactNode } from 'react'
import { PAGE_CONFIG, type PageKey } from '@/config/pages.config'

interface PageGuardProps {
    pageKey: PageKey
    children: ReactNode
}

export function PageGuard({ pageKey, children }: PageGuardProps) {
    if (!PAGE_CONFIG[pageKey]) {
        return <PlaceholderPage name={pageKey} />
    }
    return <>{children}</>
}

function PlaceholderPage({ name }: { name: string }) {
    return (
        <div className="flex h-full w-full items-center justify-center">
            <div className="text-center space-y-2">
                <p className="text-xs font-semibold uppercase tracking-widest text-[hsl(var(--foreground-muted))]">Coming Soon</p>
                <p className="text-xl font-semibold tracking-tight text-[hsl(var(--foreground))] capitalize">
                    {name.replace(/([A-Z])/g, ' $1').trim()}
                </p>
                <p className="text-xs text-[hsl(var(--foreground-subtle))]">This page is not yet enabled.</p>
            </div>
        </div>
    )
}
