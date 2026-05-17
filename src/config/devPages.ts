export const DEV_PAGES = {
    liveOps: true,
    analytics: true,
    deliveries: true,
    alerts: true,
    drivers: false,
    settings: true,
} as const

export type DevPageKey = keyof typeof DEV_PAGES

export function isPageEnabled(key: DevPageKey) {
    if (!import.meta.env.DEV) return true
    return DEV_PAGES[key]
}
