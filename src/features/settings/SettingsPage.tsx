import { useState } from 'react'
import { useTheme } from 'next-themes'
import { Sun, Moon, Monitor } from 'lucide-react'
import { ToggleSwitch } from '@/components/ui/ToggleSwitch'
import { useSettingsStore } from '@/store/settingsStore'
import { cn } from '@/lib/utils'

export default function SettingsPage() {
    const { theme, setTheme } = useTheme()
    const toastsEnabled = useSettingsStore((s) => s.toastsEnabled)
    const toggleToasts = useSettingsStore((s) => s.toggleToasts)
    const [section, setSection] = useState<'appearance' | 'notifications' | 'display'>('appearance')

    const activeTheme = theme ?? 'system'

    return (
        <div className="p-6 space-y-6">
            <div>
                <h1 className="text-xl font-semibold tracking-tight text-[hsl(var(--foreground))]">Settings</h1>
                <p className="text-xs text-[hsl(var(--foreground-muted))]">Customize alerts and appearance.</p>
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-[200px_1fr]">
                <div className="space-y-2">
                    {([
                        { key: 'appearance', label: 'Appearance' },
                        { key: 'notifications', label: 'Notifications' },
                        { key: 'display', label: 'Display' },
                    ] as const).map((item) => (
                        <button
                            key={item.key}
                            type="button"
                            onClick={() => setSection(item.key)}
                            className={cn(
                                'w-full text-left px-3 py-2 rounded text-sm transition-colors duration-100',
                                section === item.key
                                    ? 'bg-[hsl(var(--surface-raised))] text-[hsl(var(--foreground))]'
                                    : 'text-[hsl(var(--foreground-muted))] hover:bg-[hsl(var(--surface-raised))] hover:text-[hsl(var(--foreground))]'
                            )}
                        >
                            {item.label}
                        </button>
                    ))}
                </div>

                <div className="bg-[hsl(var(--surface))] border border-[hsl(var(--border))] rounded-lg p-4">
                    {section === 'appearance' && (
                        <div className="space-y-4">
                            <div>
                                <p className="text-sm font-semibold uppercase tracking-widest text-[hsl(var(--foreground-muted))]">Appearance</p>
                            </div>
                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                                {([
                                    { key: 'light', label: 'Light', Icon: Sun },
                                    { key: 'dark', label: 'Dark', Icon: Moon },
                                    { key: 'system', label: 'System', Icon: Monitor },
                                ] as const).map(({ key, label, Icon }) => (
                                    <button
                                        key={key}
                                        type="button"
                                        onClick={() => setTheme(key)}
                                        data-selected={activeTheme === key}
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

                    {section === 'notifications' && (
                        <div>
                            <p className="text-sm font-semibold uppercase tracking-widest text-[hsl(var(--foreground-muted))]">Notifications</p>
                            <div className="flex items-center justify-between py-4 border-b border-[hsl(var(--border))] last:border-0">
                                <div className="space-y-0.5 pr-8">
                                    <p className="text-sm font-medium text-[hsl(var(--foreground))]">Toast Notifications</p>
                                    <p className="text-xs text-[hsl(var(--foreground-muted))]">Show real-time alerts in the corner.</p>
                                </div>
                                <ToggleSwitch
                                    checked={toastsEnabled}
                                    onCheckedChange={toggleToasts}
                                    aria-label="Toast Notifications"
                                />
                            </div>
                        </div>
                    )}

                    {section === 'display' && (
                        <div>
                            <p className="text-sm font-semibold uppercase tracking-widest text-[hsl(var(--foreground-muted))]">Display</p>
                            <p className="text-xs text-[hsl(var(--foreground-subtle))] mt-2">No display settings yet.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
