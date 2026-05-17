import { create } from 'zustand'

interface SettingsStore {
    toastsEnabled: boolean
    toggleToasts: () => void
}

export const useSettingsStore = create<SettingsStore>()((set) => ({
    toastsEnabled: true,
    toggleToasts: () => set((s) => ({ toastsEnabled: !s.toastsEnabled })),
}))
