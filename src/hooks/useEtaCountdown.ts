import { useState, useEffect } from 'react'

function formatSeconds(s: number): string {
    const m = Math.floor(s / 60)
    const sec = s % 60
    return `${m}:${sec.toString().padStart(2, '0')}`
}

/**
 * Counts down to an absolute ISO deadline. Recomputes remaining time on every
 * tick from (deadline - Date.now()), so the display is correct across mounts,
 * SignalR reconnects, and stale-snapshot scenarios.
 */
export function useEtaCountdown(etaDeadline: string | null) {
    const [display, setDisplay] = useState('--:--')

    useEffect(() => {
        if (etaDeadline === null) {
            setDisplay('--:--')
            return
        }

        const deadlineMs = new Date(etaDeadline).getTime()

        const tick = () => {
            const remaining = Math.floor((deadlineMs - Date.now()) / 1000)
            setDisplay(remaining > 0 ? formatSeconds(remaining) : 'Arrived')
        }

        tick()
        const interval = setInterval(tick, 1000)
        return () => clearInterval(interval)
    }, [etaDeadline])

    return display
}
