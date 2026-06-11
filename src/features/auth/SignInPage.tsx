import { useState } from 'react'
import { useSignIn, useAuth } from '@clerk/clerk-react'
import { Navigate, useNavigate } from 'react-router-dom'

const GridTrackLogo = () => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        width="32"
        height="30"
        fill="none"
        viewBox="0 0 48 46"
        className="text-[hsl(var(--primary))]"
    >
        <path
            fill="currentColor"
            d="M25.946 44.938c-.664.845-2.021.375-2.021-.698V33.937a2.26 2.26 0 0 0-2.262-2.262H10.287c-.92 0-1.456-1.04-.92-1.788l7.48-10.471c1.07-1.497 0-3.578-1.842-3.578H1.237c-.92 0-1.456-1.04-.92-1.788L10.013.474c.214-.297.556-.474.92-.474h28.894c.92 0 1.456 1.04.92 1.788l-7.48 10.471c-1.07 1.498 0 3.579 1.842 3.579h11.377c.943 0 1.473 1.088.89 1.83L25.947 44.94z"
        />
    </svg>
)

export default function SignInPage() {
    const { isLoaded: authLoaded, isSignedIn } = useAuth()
    const { isLoaded, signIn, setActive } = useSignIn()
    const navigate = useNavigate()

    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState<string | null>(null)
    const [loading, setLoading] = useState(false)

    // Already authenticated — go straight to the dashboard
    if (authLoaded && isSignedIn) {
        return <Navigate to="/" replace />
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        if (!isLoaded) return
        setError(null)
        setLoading(true)
        try {
            const result = await signIn.create({ identifier: email, password })
            if (result.status === 'complete') {
                await setActive({ session: result.createdSessionId })
                navigate('/', { replace: true })
            } else {
                setError('Additional verification is required. Please use the Clerk dashboard.')
            }
        } catch (err: unknown) {
            const clerkErr = err as { errors?: Array<{ longMessage?: string; message?: string }> }
            setError(clerkErr.errors?.[0]?.longMessage ?? clerkErr.errors?.[0]?.message ?? 'Sign in failed.')
        } finally {
            setLoading(false)
        }
    }

    const disabled = !isLoaded || loading

    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-[hsl(var(--background))] px-4">
            {/* Brand mark */}
            <div className="mb-8 flex flex-col items-center gap-3">
                <GridTrackLogo />
                <span className="text-lg font-semibold tracking-tight text-[hsl(var(--foreground))]">
                    GridTrack
                </span>
            </div>

            {/* Card */}
            <div className="w-full max-w-sm rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--surface))] p-8 shadow-sm">
                <h1 className="mb-1 text-base font-semibold text-[hsl(var(--foreground))]">
                    Sign in to your workspace
                </h1>
                <p className="mb-6 text-xs text-[hsl(var(--foreground-muted))]">
                    Operations dashboard · Damascus fleet
                </p>

                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                    <div className="flex flex-col gap-1.5">
                        <label
                            htmlFor="email"
                            className="text-xs font-medium text-[hsl(var(--foreground-muted))]"
                        >
                            Email
                        </label>
                        <input
                            id="email"
                            type="email"
                            autoComplete="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            disabled={disabled}
                            placeholder="you@example.com"
                            className="h-9 w-full rounded-md border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3 text-sm text-[hsl(var(--foreground))] placeholder-[hsl(var(--foreground-subtle))] outline-none transition-colors focus:border-[hsl(var(--border-strong))] focus:ring-2 focus:ring-[hsl(var(--primary)/0.2)] disabled:cursor-not-allowed disabled:opacity-50"
                        />
                    </div>

                    <div className="flex flex-col gap-1.5">
                        <label
                            htmlFor="password"
                            className="text-xs font-medium text-[hsl(var(--foreground-muted))]"
                        >
                            Password
                        </label>
                        <input
                            id="password"
                            type="password"
                            autoComplete="current-password"
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            disabled={disabled}
                            placeholder="••••••••"
                            className="h-9 w-full rounded-md border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3 text-sm text-[hsl(var(--foreground))] placeholder-[hsl(var(--foreground-subtle))] outline-none transition-colors focus:border-[hsl(var(--border-strong))] focus:ring-2 focus:ring-[hsl(var(--primary)/0.2)] disabled:cursor-not-allowed disabled:opacity-50"
                        />
                    </div>

                    {error && (
                        <p className="rounded-md border border-[hsl(var(--destructive)/0.3)] bg-[hsl(var(--destructive)/0.08)] px-3 py-2 text-xs text-[hsl(var(--destructive))]">
                            {error}
                        </p>
                    )}

                    <button
                        type="submit"
                        disabled={disabled}
                        className="mt-1 h-9 w-full rounded-md bg-[hsl(var(--primary))] px-4 text-sm font-medium text-[hsl(var(--primary-foreground))] transition-colors hover:bg-[hsl(var(--primary-hover))] disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        {loading ? 'Signing in…' : 'Continue'}
                    </button>
                </form>
            </div>

            {/* Footer */}
            <p className="mt-6 text-[11px] text-[hsl(var(--foreground-subtle))]">
                GridTrack · Fleet Operations Platform
            </p>
        </div>
    )
}
