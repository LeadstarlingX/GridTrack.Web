import { useState, useEffect } from 'react'

function formatSeconds(s: number): string {
    const m = Math.floor(s / 60)
    const sec = s % 60
    return `${m}:${sec.toString().padStart(2, '0')}`
}

export function useEtaCountdown(etaSeconds: number | null) {
    const [display, setDisplay] = useState('--:--')

    useEffect(() => {
        if (etaSeconds === null) {
            setDisplay('--:--')
            return
        }

        // ← ADD this block
        if (etaSeconds <= 0) {
            setDisplay('Arrived')
            return
        }

        let remaining = etaSeconds
        setDisplay(formatSeconds(remaining))

        const interval = setInterval(() => {
            remaining -= 1
            if (remaining <= 0) {
                setDisplay('Arrived')
                clearInterval(interval)
                return
            }
            setDisplay(formatSeconds(remaining))
        }, 1000)

        return () => clearInterval(interval)
    }, [etaSeconds])

    return display
}