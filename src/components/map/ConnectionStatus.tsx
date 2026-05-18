export default function ConnectionStatus() {
    return (
        <div className="absolute top-4 left-4 z-[1000] flex items-center gap-2 bg-[hsl(var(--map-overlay))] dark:bg-[hsl(var(--map-overlay-dark))] backdrop-blur-sm border border-[hsl(var(--border))] rounded-lg px-3 py-1.5 shadow-sm">
      <span className="relative flex h-2.5 w-2.5">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500" />
      </span>
            <span className="text-xs font-medium text-[hsl(var(--foreground))]">Live</span>
        </div>
    )
}