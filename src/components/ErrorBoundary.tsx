import { Component, type ReactNode } from 'react'

interface Props {
    children: ReactNode
    fallback?: ReactNode
}

interface State {
    hasError: boolean
}

export class ErrorBoundary extends Component<Props, State> {
    state: State = { hasError: false }

    static getDerivedStateFromError(): State {
        return { hasError: true }
    }

    override render() {
        if (!this.state.hasError) return this.props.children

        return (
            this.props.fallback ?? (
                <div className="flex items-center justify-center p-8">
                    <div className="rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--surface))] p-6 text-center space-y-2 max-w-xs">
                        <p className="text-sm font-medium text-[hsl(var(--foreground))]">Something went wrong</p>
                        <p className="text-xs text-[hsl(var(--foreground-muted))]">
                            <button
                                onClick={() => this.setState({ hasError: false })}
                                className="underline text-[hsl(var(--primary))] hover:opacity-80"
                            >
                                Reload this section
                            </button>
                        </p>
                    </div>
                </div>
            )
        )
    }
}
