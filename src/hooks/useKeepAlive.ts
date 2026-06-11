import { useEffect } from 'react'

const INTERVAL_MS = 10 * 60 * 1000 // 10 minutes — well under Render's 15-min sleep threshold

/**
 * Sends a lightweight HTTP ping to /health every 10 minutes.
 * Prevents Render's free-tier service from sleeping during an active session,
 * which would otherwise kill the SignalR WebSocket connection.
 */
export function useKeepAlive() {
    useEffect(() => {
        if (import.meta.env.VITE_USE_MOCK_SIGNALR !== 'false') return

        const ping = () => {
            const base = import.meta.env.VITE_API_BASE_URL ?? ''
            fetch(`${base}/health`, { signal: AbortSignal.timeout(10_000) }).catch(() => {})
        }

        ping()
        const id = setInterval(ping, INTERVAL_MS)
        return () => clearInterval(id)
    }, [])
}
