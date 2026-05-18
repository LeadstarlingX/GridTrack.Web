import { useSettingsStore } from '@/store/settingsStore'

export function useToastSettings() {
    const toastsEnabled = useSettingsStore((s) => s.toastsEnabled)
    return { toastsEnabled }
}
