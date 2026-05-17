import { useTheme } from 'next-themes'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useSettingsStore } from '@/store/settingsStore'
import { isPageEnabled } from '@/config/devPages'
import DevDisabled from '@/components/shared/DevDisabled'

interface SwitchProps {
    checked: boolean
    onChange: () => void
    label: string
}

function Switch({ checked, onChange, label }: SwitchProps) {
    return (
        <button
            type="button"
            role="switch"
            aria-checked={checked}
            onClick={onChange}
            className={`relative inline-flex h-9 w-16 items-center rounded-full transition ${checked ? 'bg-emerald-500' : 'bg-red-500'}`}
        >
            <span className="sr-only">{label}</span>
            <span
                className={`inline-block h-7 w-7 rounded-full bg-white shadow transition ${checked ? 'translate-x-8' : 'translate-x-2'}`}
            />
        </button>
    )
}

export default function SettingsPage() {
    const { theme, setTheme } = useTheme()
    const toastsEnabled = useSettingsStore((s) => s.toastsEnabled)
    const toggleToasts = useSettingsStore((s) => s.toggleToasts)

    const activeTheme = theme ?? 'system'

    if (!isPageEnabled('settings')) {
        return <DevDisabled title="Settings" />
    }

    return (
        <div className="p-6 space-y-6">
            <div>
                <h1 className="text-2xl font-semibold">Settings</h1>
                <p className="text-sm text-muted-foreground">Customize alerts and appearance.</p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="text-base">Notifications</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                    <label className="flex items-center justify-between gap-4 text-sm">
                        <span>Show anomaly toast notifications</span>
                        <Switch checked={toastsEnabled} onChange={toggleToasts} label="Show anomaly toast notifications" />
                    </label>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="text-base">Theme</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-wrap gap-2">
                    <Button
                        variant={activeTheme === 'light' ? 'default' : 'outline'}
                        onClick={() => setTheme('light')}
                    >
                        Light
                    </Button>
                    <Button
                        variant={activeTheme === 'dark' ? 'default' : 'outline'}
                        onClick={() => setTheme('dark')}
                    >
                        Dark
                    </Button>
                    <Button
                        variant={activeTheme === 'system' ? 'default' : 'outline'}
                        onClick={() => setTheme('system')}
                    >
                        System
                    </Button>
                </CardContent>
            </Card>
        </div>
    )
}
