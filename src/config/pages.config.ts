export const PAGE_CONFIG = {
    liveOps: true,
    analytics: false,
    deliveries: false,
    alerts: false,
    drivers: false,
    settings: true,
} as const

export type PageKey = keyof typeof PAGE_CONFIG
