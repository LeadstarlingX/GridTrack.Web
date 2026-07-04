import { useState, useEffect } from 'react'
import { useTheme } from 'next-themes'
import { Sun, Moon, Monitor, LogOut, User } from 'lucide-react'
import { useClerk, useUser } from '@clerk/clerk-react'
import { ToggleSwitch } from '@/components/ui/ToggleSwitch'
import { useSettingsStore } from '@/store/settingsStore'
import { useMapStore } from '@/store/mapStore'
import { toast } from '@/components/ui/sonner'
import { cn } from '@/lib/utils'

interface LatencyResult { ok: boolean; ms: number; error?: string }
interface LatencyResponse { postgres: LatencyResult; redis: LatencyResult; python: LatencyResult; osrm: LatencyResult; rabbit: LatencyResult }

type Section = 'appearance' | 'notifications' | 'connection' | 'account'

const PING_INTERVAL_MS = 3_000
const PING_TIMEOUT_MS  = 8_000

export default function SettingsPage() {
    const { theme, setTheme } = useTheme()
    const toastsEnabled = useSettingsStore((s) => s.toastsEnabled)
    const toggleToasts = useSettingsStore((s) => s.toggleToasts)
    const [section, setSection] = useState<Section>('appearance')

    const hubStatus = useMapStore((s) => s.hubStatus)
    const hubRtt = useMapStore((s) => s.hubRtt)
    const [latency, setLatency] = useState<LatencyResponse | null>(null)
    const [pinging, setPinging] = useState(false)
    const [pingError, setPingError] = useState<string | null>(null)

    // Clerk
    const { signOut } = useClerk()
    const { user } = useUser()
    const [signingOut, setSigningOut] = useState(false)

    const handleSignOut = async () => {
        setSigningOut(true)
        try {
            await signOut({ redirectUrl: '/sign-in' })
        } catch {
            toast.error('Sign-out failed — try again.')
            setSigningOut(false)
        }
    }

    // Auto-ping loop: fires immediately, waits for response, then waits 3 s before next ping.
    // Chained (not setInterval) so requests never overlap.
    useEffect(() => {
        if (section !== 'connection') return
        let cancelled = false
        const abortRef = { current: new AbortController() }

        async function doPing() {
            if (cancelled) return
            abortRef.current = new AbortController()
            const timerId = setTimeout(() => abortRef.current.abort(), PING_TIMEOUT_MS)
            setPinging(true)
            try {
                const base = import.meta.env.VITE_API_BASE_URL ?? ''
                const res = await fetch(`${base}/api/diagnostics/latency`, { signal: abortRef.current.signal })
                if (!res.ok) throw new Error(`HTTP ${res.status}`)
                const data: LatencyResponse = await res.json()
                if (!cancelled) { setLatency(data); setPingError(null) }
            } catch (err) {
                if (cancelled) return
                if (err instanceof Error && err.name === 'AbortError') {
                    setPingError('Timed out — backend may be cold-starting.')
                } else {
                    setPingError('API unreachable.')
                }
                setLatency(null)
            } finally {
                clearTimeout(timerId)
                if (!cancelled) {
                    setPinging(false)
                    setTimeout(doPing, PING_INTERVAL_MS)
                }
            }
        }

        doPing()
        return () => {
            cancelled = true
            abortRef.current.abort()
        }
    }, [section])

    const activeTheme = theme ?? 'system'

    const navItems: { key: Section; label: string }[] = [
        { key: 'appearance',   label: 'Appearance' },
        { key: 'notifications', label: 'Notifications' },
        { key: 'connection',   label: 'Connection' },
        { key: 'account',      label: 'Account' },
    ]

    return (
        <div className="p-6 space-y-6">
            <div>
                <h1 className="text-xl font-semibold tracking-tight text-[hsl(var(--foreground))]">Settings</h1>
                <p className="text-xs text-[hsl(var(--foreground-muted))]">Configure display, map defaults, and notifications.</p>
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-[200px_1fr]">
                {/* Section nav */}
                <div className="space-y-1">
                    {navItems.map((item) => (
                        <button
                            key={item.key}
                            type="button"
                            onClick={() => setSection(item.key)}
                            className={cn(
                                'w-full text-left px-3 py-2 rounded-lg text-sm transition-colors duration-100',
                                section === item.key
                                    ? 'bg-[hsl(var(--surface-raised))] text-[hsl(var(--foreground))]'
                                    : 'text-[hsl(var(--foreground-muted))] hover:bg-[hsl(var(--surface-raised))] hover:text-[hsl(var(--foreground))]'
                            )}
                        >
                            {item.label}
                        </button>
                    ))}
                </div>

                {/* Section content */}
                <div className="space-y-4">
                    {/* ── Appearance ── */}
                    {section === 'appearance' && (
                        <div className="bg-[hsl(var(--surface))] border border-[hsl(var(--border))] rounded-xl p-5 space-y-5">
                            <p className="text-xs font-semibold uppercase tracking-widest text-[hsl(var(--foreground-muted))]">Theme</p>
                            <div className="grid grid-cols-3 gap-3">
                                {([
                                    { key: 'light', label: 'Light', Icon: Sun },
                                    { key: 'dark',  label: 'Dark',  Icon: Moon },
                                    { key: 'system',label: 'System',Icon: Monitor },
                                ] as const).map(({ key, label, Icon }) => (
                                    <button
                                        key={key}
                                        type="button"
                                        onClick={() => setTheme(key)}
                                        className={cn(
                                            'border border-[hsl(var(--border))] rounded-lg p-4 text-center text-sm font-medium text-[hsl(var(--foreground))]',
                                            'hover:border-[hsl(var(--border-strong))] transition-colors duration-100',
                                            activeTheme === key && 'border-[hsl(var(--primary))] bg-[hsl(var(--surface-raised))]'
                                        )}
                                    >
                                        <Icon className="mx-auto mb-2" size={18} />
                                        {label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* ── Notifications ── */}
                    {section === 'notifications' && (
                        <div className="bg-[hsl(var(--surface))] border border-[hsl(var(--border))] rounded-xl p-5 space-y-4">
                            <p className="text-xs font-semibold uppercase tracking-widest text-[hsl(var(--foreground-muted))]">Notifications</p>
                            <SettingRow label="Toast notifications" description="Show real-time alerts in the corner.">
                                <ToggleSwitch checked={toastsEnabled} onCheckedChange={toggleToasts} aria-label="Toast Notifications" />
                            </SettingRow>

                            <div className="pt-4 border-t border-[hsl(var(--border))]">
                                <p className="text-xs font-semibold uppercase tracking-widest text-[hsl(var(--foreground-muted))] mb-4">Toast Preview</p>
                                <div className="grid grid-cols-2 gap-2">
                                    {[
                                        { label: 'Error',   fn: () => toast.error('Failed to load delivery data — retrying…') },
                                        { label: 'Warning', fn: () => toast.warning('Driver Hassan N. has been stalled for 14 min') },
                                        { label: 'Success', fn: () => toast.success('Driver availability updated successfully') },
                                        { label: 'Info',    fn: () => toast.info('Historical heatmap data loaded') },
                                    ].map(({ label, fn }) => (
                                        <button
                                            key={label}
                                            type="button"
                                            onClick={fn}
                                            className="px-3 py-2 rounded-lg border border-[hsl(var(--border))] text-sm text-[hsl(var(--foreground-muted))] hover:bg-[hsl(var(--surface-raised))] hover:text-[hsl(var(--foreground))] transition-colors"
                                        >
                                            {label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ── Connection ── */}
                    {section === 'connection' && (
                        <div className="space-y-4">
                            {/* Total latency summary */}
                            <div className="bg-[hsl(var(--surface))] border border-[hsl(var(--border))] rounded-xl p-5">
                                <p className="text-xs font-semibold uppercase tracking-widest text-[hsl(var(--foreground-muted))] mb-3">End-to-End Latency</p>
                                <div className="flex items-end gap-3 mb-3">
                                    <span className={cn(
                                        'text-4xl font-bold tabular-nums',
                                        hubRtt == null ? 'text-[hsl(var(--foreground-muted))]'
                                            : hubRtt < 100 ? 'text-green-500'
                                                : hubRtt < 300 ? 'text-amber-500'
                                                    : 'text-red-500'
                                    )}>
                                        {hubRtt != null ? `${hubRtt}` : '—'}
                                    </span>
                                    <span className="text-sm text-[hsl(var(--foreground-muted))] mb-1.5">ms  SignalR round-trip</span>
                                </div>
                                <p className="text-[11px] text-[hsl(var(--foreground-subtle))] leading-relaxed">
                                    Measured browser → hub → browser every 5 s. This is what live map updates cost.
                                    Service dependencies (Postgres, Redis, etc.) are additional per-request overhead — shown below.
                                </p>
                            </div>

                            <div className="bg-[hsl(var(--surface))] border border-[hsl(var(--border))] rounded-xl p-5 space-y-4">
                                <p className="text-xs font-semibold uppercase tracking-widest text-[hsl(var(--foreground-muted))]">SignalR</p>
                                <SettingRow label="Status" description="Current hub connection state.">
                                    <span className={cn(
                                        'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold',
                                        hubStatus === 'connected'
                                            ? 'bg-green-500/15 text-green-600 dark:text-green-400'
                                            : hubStatus === 'reconnecting'
                                                ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
                                                : 'bg-red-500/15 text-red-600 dark:text-red-400'
                                    )}>
                                        <span className={cn(
                                            'inline-block w-1.5 h-1.5 rounded-full',
                                            hubStatus === 'connected' ? 'bg-green-500' : hubStatus === 'reconnecting' ? 'bg-amber-500' : 'bg-red-500'
                                        )} />
                                        {hubStatus === 'connected' ? 'Connected' : hubStatus === 'reconnecting' ? 'Reconnecting' : 'Disconnected'}
                                    </span>
                                </SettingRow>
                            </div>

                            <div className="bg-[hsl(var(--surface))] border border-[hsl(var(--border))] rounded-xl p-5 space-y-4">
                                <div className="flex items-center justify-between">
                                    <p className="text-xs font-semibold uppercase tracking-widest text-[hsl(var(--foreground-muted))]">Service Latency</p>
                                    <span className="inline-flex items-center gap-1.5 text-xs text-[hsl(var(--foreground-muted))]">
                                        <span className={cn(
                                            'inline-block w-1.5 h-1.5 rounded-full',
                                            pinging ? 'bg-amber-400 animate-pulse' : 'bg-green-500'
                                        )} />
                                        {pinging ? 'Pinging…' : 'Live · 3 s'}
                                    </span>
                                </div>
                                {latency ? (
                                    <div className="space-y-2">
                                        {(['postgres', 'redis', 'python', 'osrm', 'rabbit'] as const).map((svc) => {
                                            const r = latency[svc]
                                            const label = svc === 'postgres' ? 'PostgreSQL (Neon)' : svc === 'redis' ? 'Redis (Render)' : svc === 'python' ? 'Python (Forecasting)' : svc === 'osrm' ? 'OSRM (Routing)' : 'RabbitMQ (CloudAMQP)'
                                            return (
                                                <div key={svc} className="flex items-center justify-between py-2 border-b border-[hsl(var(--border))] last:border-0">
                                                    <div>
                                                        <p className="text-sm text-[hsl(var(--foreground))]">{label}</p>
                                                        {!r.ok && <p className="text-xs text-red-500 mt-0.5 truncate max-w-[220px]">{r.error}</p>}
                                                    </div>
                                                    <span className={cn(
                                                        'text-sm font-mono font-semibold',
                                                        !r.ok ? 'text-red-500' : r.ms < 50 ? 'text-green-500' : r.ms < 200 ? 'text-amber-500' : 'text-red-500'
                                                    )}>
                                                        {r.ok ? `${r.ms} ms` : 'error'}
                                                    </span>
                                                </div>
                                            )
                                        })}
                                    </div>
                                ) : (
                                    <p className="text-xs text-[hsl(var(--foreground-muted))]">
                                        {pingError ?? 'Waiting for response…'}
                                    </p>
                                )}
                            </div>
                        </div>
                    )}

                    {/* ── Account ── */}
                    {section === 'account' && (
                        <div className="space-y-4">
                            {/* User info */}
                            <div className="bg-[hsl(var(--surface))] border border-[hsl(var(--border))] rounded-xl p-5">
                                <p className="text-xs font-semibold uppercase tracking-widest text-[hsl(var(--foreground-muted))] mb-4">Signed in as</p>
                                <div className="flex items-center gap-3">
                                    {user?.imageUrl ? (
                                        <img
                                            src={user.imageUrl}
                                            alt={user.fullName ?? 'User'}
                                            className="w-10 h-10 rounded-full object-cover ring-2 ring-[hsl(var(--border))]"
                                        />
                                    ) : (
                                        <div className="w-10 h-10 rounded-full bg-[hsl(var(--primary)/0.15)] flex items-center justify-center">
                                            <User size={18} className="text-[hsl(var(--primary))]" />
                                        </div>
                                    )}
                                    <div>
                                        <p className="text-sm font-medium text-[hsl(var(--foreground))]">
                                            {user?.fullName ?? '—'}
                                        </p>
                                        <p className="text-xs text-[hsl(var(--foreground-muted))]">
                                            {user?.primaryEmailAddress?.emailAddress ?? '—'}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Sign out */}
                            <div className="bg-[hsl(var(--surface))] border border-[hsl(var(--border))] rounded-xl p-5">
                                <p className="text-xs font-semibold uppercase tracking-widest text-[hsl(var(--foreground-muted))] mb-4">Session</p>
                                <SettingRow
                                    label="Sign out"
                                    description="End your session on this device."
                                >
                                    <button
                                        type="button"
                                        onClick={handleSignOut}
                                        disabled={signingOut}
                                        className={cn(
                                            'inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-100',
                                            'border border-red-500/40 text-red-500 hover:bg-red-500/10',
                                            'disabled:opacity-50 disabled:cursor-not-allowed'
                                        )}
                                    >
                                        <LogOut size={14} />
                                        {signingOut ? 'Signing out…' : 'Sign out'}
                                    </button>
                                </SettingRow>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

function SettingRow({ label, description, children }: { label: string; description?: string; children: React.ReactNode }) {
    return (
        <div className="flex items-center justify-between gap-4 py-2 border-b border-[hsl(var(--border))] last:border-0">
            <div>
                <p className="text-sm text-[hsl(var(--foreground))]">{label}</p>
                {description && <p className="text-xs text-[hsl(var(--foreground-muted))] mt-0.5">{description}</p>}
            </div>
            {children}
        </div>
    )
}
