import { useMapStore } from '@/store/mapStore'

const STATUS_CONFIG = {
    connected: {
        dot: 'bg-green-500',
        ping: 'bg-green-400',
        label: 'Live',
    },
    reconnecting: {
        dot: 'bg-amber-500',
        ping: 'bg-amber-400',
        label: 'Reconnecting...',
    },
    disconnected: {
        dot: 'bg-red-500',
        ping: 'bg-red-400',
        label: 'Disconnected',
    },
} as const

export default function ConnectionStatus() {
    const hubStatus = useMapStore((s) => s.hubStatus)
    const config = STATUS_CONFIG[hubStatus]

    return (
        <div className="absolute top-4 left-4 z-[1000] flex items-center gap-2 bg-[hsl(var(--map-overlay))] dark:bg-[hsl(var(--map-overlay-dark))] backdrop-blur-sm border border-[hsl(var(--border))] rounded-lg px-3 py-1.5 shadow-sm">
            <span className="relative flex h-2.5 w-2.5">
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${config.ping} opacity-75`} />
                <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${config.dot}`} />
            </span>
            <span className="text-xs font-medium text-[hsl(var(--foreground))]">{config.label}</span>
        </div>
    )
}
