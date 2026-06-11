import { useState } from 'react'
import { useTheme } from 'next-themes'
import { Sun, Moon, Monitor } from 'lucide-react'
import { ToggleSwitch } from '@/components/ui/ToggleSwitch'
import { useSettingsStore } from '@/store/settingsStore'
import { useMapStore } from '@/store/mapStore'
import { toast } from '@/components/ui/sonner'
import { APP_CONFIG } from '@/config/app.config'
import { cn } from '@/lib/utils'

type Section = 'appearance' | 'notifications' | 'map' | 'connection'

export default function SettingsPage() {
    const { theme, setTheme } = useTheme()
    const toastsEnabled = useSettingsStore((s) => s.toastsEnabled)
    const toggleToasts = useSettingsStore((s) => s.toggleToasts)
    const [section, setSection] = useState<Section>('appearance')

    const hexGridEnabled = useMapStore((s) => s.hexGridEnabled)
    const toggleHexGrid = useMapStore((s) => s.toggleHexGrid)
    const hexResolution = useMapStore((s) => s.hexResolution)
    const setHexResolution = useMapStore((s) => s.setHexResolution)
    const hubStatus = useMapStore((s) => s.hubStatus)

    const activeTheme = theme ?? 'system'
    const minRes = APP_CONFIG.map.hexResolution.min
    const maxRes = APP_CONFIG.map.hexResolution.max

    const navItems: { key: Section; label: string }[] = [
        { key: 'appearance', label: 'Appearance' },
        { key: 'notifications', label: 'Notifications' },
        { key: 'map', label: 'Map Defaults' },
        { key: 'connection', label: 'Connection' },
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
                                    { key: 'dark', label: 'Dark', Icon: Moon },
                                    { key: 'system', label: 'System', Icon: Monitor },
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
                                        { label: 'Error', fn: () => toast.error('Failed to load delivery data — retrying…') },
                                        { label: 'Warning', fn: () => toast.warning('Driver Hassan N. has been stalled for 14 min') },
                                        { label: 'Success', fn: () => toast.success('Driver availability updated successfully') },
                                        { label: 'Info', fn: () => toast.info('Historical heatmap data loaded') },
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

                    {/* ── Map Defaults ── */}
                    {section === 'map' && (
                        <div className="bg-[hsl(var(--surface))] border border-[hsl(var(--border))] rounded-xl p-5 space-y-4">
                            <p className="text-xs font-semibold uppercase tracking-widest text-[hsl(var(--foreground-muted))]">Map Defaults</p>
                            <SettingRow label="Hex grid" description="Show hexagonal demand overlay on the live map.">
                                <ToggleSwitch checked={hexGridEnabled} onCheckedChange={() => toggleHexGrid()} aria-label="Hex Grid" />
                            </SettingRow>
                            <SettingRow label="H3 resolution" description={`R${hexResolution} — lower is larger cells.`}>
                                <div className="flex items-center gap-3">
                                    <input
                                        type="range"
                                        min={minRes}
                                        max={maxRes}
                                        step={1}
                                        value={hexResolution}
                                        onChange={(e) => setHexResolution(Number(e.target.value))}
                                        className="w-28"
                                        style={{ accentColor: 'hsl(var(--primary))' }}
                                    />
                                    <span className="text-sm font-mono text-[hsl(var(--primary))] w-8">R{hexResolution}</span>
                                </div>
                            </SettingRow>
                        </div>
                    )}

                    {/* ── Connection ── */}
                    {section === 'connection' && (
                        <div className="bg-[hsl(var(--surface))] border border-[hsl(var(--border))] rounded-xl p-5 space-y-4">
                            <p className="text-xs font-semibold uppercase tracking-widest text-[hsl(var(--foreground-muted))]">Connection</p>
                            <SettingRow label="SignalR endpoint" description="Real-time data hub URL.">
                                <span className="text-xs font-mono text-[hsl(var(--foreground-muted))]">wss://api.gridtrack.sy/hub</span>
                            </SettingRow>
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
                            <SettingRow label="Last update" description="Time of most recent data tick.">
                                <span className="text-xs font-mono text-[hsl(var(--foreground-muted))]">{new Date().toLocaleTimeString()}</span>
                            </SettingRow>
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
