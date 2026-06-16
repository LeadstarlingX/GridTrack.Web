import { useEffect } from 'react'

// Ping /health every 10 min to prevent Render free-tier from sleeping and killing the SignalR connection.
const INTERVAL_MS = 10 * 60 * 1000
export function useKeepAlive() {
    useEffect(() => {
        const ping = () => {
            const base = import.meta.env.VITE_API_BASE_URL ?? ''
            fetch(`${base}/health`, { signal: AbortSignal.timeout(10_000) }).catch(() => {})
        }

        ping()
        const id = setInterval(ping, INTERVAL_MS)
        return () => clearInterval(id)
    }, [])
}
