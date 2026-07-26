import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { queryClient } from '@/app/providers'

const GridTrackLogo = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="36" height="34" fill="none" viewBox="0 0 48 46" className="text-[hsl(var(--primary))]">
        <path fill="currentColor" d="M25.946 44.938c-.664.845-2.021.375-2.021-.698V33.937a2.26 2.26 0 0 0-2.262-2.262H10.287c-.92 0-1.456-1.04-.92-1.788l7.48-10.471c1.07-1.497 0-3.578-1.842-3.578H1.237c-.92 0-1.456-1.04-.92-1.788L10.013.474c.214-.297.556-.474.92-.474h28.894c.92 0 1.456 1.04.92 1.788l-7.48 10.471c-1.07 1.498 0 3.579 1.842 3.579h11.377c.943 0 1.473 1.088.89 1.83L25.947 44.94z" />
    </svg>
)

const DEMO_ACCOUNTS = [
    { username: 'admin',     password: 'admin123',     label: 'admin',     hint: 'Full access'           },
    { username: 'observer',  password: 'observer123',  label: 'observer',  hint: 'North + South'         },
    { username: 'observer2', password: 'observer2123', label: 'observer2', hint: 'East + West'            },
]

export default function SignInPage() {
    const token    = useAuthStore((s) => s.token)
    const login    = useAuthStore((s) => s.login)
    const navigate = useNavigate()

    const [username, setUsername] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError]       = useState<string | null>(null)
    const [loading, setLoading]   = useState(false)

    if (token) return <Navigate to="/" replace />

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        setError(null)
        setLoading(true)
        try {
            const base = import.meta.env.VITE_API_BASE_URL ?? ''
            const res  = await fetch(`${base}/api/auth/login`, {
                method:  'POST',
                headers: { 'Content-Type': 'application/json' },
                body:    JSON.stringify({ username, password }),
            })
            const data = await res.json() as { token?: string; message?: string }
            if (!res.ok) {
                setError(data.message ?? 'Sign in failed.')
                return
            }
            login(data.token!)
            queryClient.clear()
            navigate('/', { replace: true })
        } catch {
            setError('Network error — check your connection.')
        } finally {
            setLoading(false)
        }
    }

    const inputCls = 'h-9 w-full rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3 text-sm text-[hsl(var(--foreground))] placeholder-[hsl(var(--foreground-subtle))] outline-none focus:border-[hsl(var(--primary)/0.6)] focus:ring-2 focus:ring-[hsl(var(--primary)/0.15)] disabled:opacity-50 transition-colors'

    return (
        <div className="relative flex min-h-screen flex-col items-center justify-center px-4 bg-[hsl(var(--background))]">
            {/* Subtle radial glow behind card */}
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_hsl(var(--primary)/0.05),_transparent_60%)]" />

            {/* Logo */}
            <div className="relative mb-6 flex flex-col items-center gap-3">
                <GridTrackLogo />
                <span className="text-lg font-semibold tracking-tight text-[hsl(var(--foreground))]">GridTrack</span>
            </div>

            {/* Card */}
            <div className="relative w-full max-w-sm rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--surface))] p-8 shadow-[var(--shadow-elevated,0_4px_24px_rgb(0_0_0/0.08))] backdrop-blur-lg">
                <h1 className="mb-0.5 text-base font-semibold text-[hsl(var(--foreground))]">Sign in to your workspace</h1>
                <p className="mb-6 text-xs text-[hsl(var(--foreground-muted))]">Operations dashboard · Damascus fleet</p>

                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                    <div className="flex flex-col gap-1.5">
                        <label htmlFor="username" className="text-xs font-medium text-[hsl(var(--foreground-muted))]">Username</label>
                        <input
                            id="username" type="text" autoComplete="username" required
                            value={username} onChange={(e) => setUsername(e.target.value)}
                            disabled={loading} placeholder="admin"
                            className={inputCls}
                        />
                    </div>

                    <div className="flex flex-col gap-1.5">
                        <label htmlFor="password" className="text-xs font-medium text-[hsl(var(--foreground-muted))]">Password</label>
                        <input
                            id="password" type="password" autoComplete="current-password" required
                            value={password} onChange={(e) => setPassword(e.target.value)}
                            disabled={loading} placeholder="••••••••"
                            className={inputCls}
                        />
                    </div>

                    {error && (
                        <p className="rounded-lg border border-[hsl(var(--destructive)/0.3)] bg-[hsl(var(--destructive)/0.08)] px-3 py-2 text-xs text-[hsl(var(--destructive))]">
                            {error}
                        </p>
                    )}

                    <button
                        type="submit" disabled={loading}
                        className="mt-1 h-9 w-full rounded-lg bg-[hsl(var(--primary))] px-4 text-sm font-medium text-[hsl(var(--primary-foreground))] hover:bg-[hsl(var(--primary-hover))] disabled:cursor-not-allowed disabled:opacity-50 transition-colors"
                    >
                        {loading ? 'Signing in…' : 'Continue'}
                    </button>
                </form>
            </div>

            {/* Demo accounts — chip pills */}
            <div className="relative mt-4 w-full max-w-sm">
                <p className="mb-2 text-[11px] font-semibold uppercase tracking-widest text-[hsl(var(--foreground-muted))]">
                    Demo accounts
                </p>
                <div className="flex flex-wrap gap-2">
                    {DEMO_ACCOUNTS.map((acc) => (
                        <button
                            key={acc.username}
                            type="button"
                            onClick={() => { setUsername(acc.username); setPassword(acc.password) }}
                            className="flex items-center gap-1.5 rounded-full border border-[hsl(var(--border))] bg-[hsl(var(--surface))] px-3 py-1.5 text-xs transition-colors hover:border-[hsl(var(--primary)/0.4)] hover:bg-[hsl(var(--primary)/0.06)] hover:text-[hsl(var(--foreground))]"
                        >
                            <span className="font-mono font-semibold text-[hsl(var(--foreground))]">{acc.label}</span>
                            <span className="text-[hsl(var(--foreground-subtle,var(--foreground-muted)))]">· {acc.hint}</span>
                        </button>
                    ))}
                </div>
            </div>

            <p className="relative mt-6 text-[11px] text-[hsl(var(--foreground-subtle,var(--foreground-muted)))]">
                GridTrack · Fleet Operations Platform
            </p>
        </div>
    )
}
