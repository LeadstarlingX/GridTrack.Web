export const PAGE_CONFIG = {
    liveOps: true,
    analytics: true,
    analyticsChatbot: {
        enabled: true,
        disabledMessage: 'Comming soon',
    },
    deliveries: true,
    alerts: true,
    drivers: true,
    settings: true,
} as const

export type PageKey = keyof typeof PAGE_CONFIG
