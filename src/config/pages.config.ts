export const PAGE_CONFIG = {
    liveOps: true,
    analytics: true,
    analyticsChatbot: {
        enabled: true,
        disabledMessage: 'Comming soon',
    },
    deliveries: false,
    alerts: false,
    drivers: false,
    settings: true,
} as const

export type PageKey = keyof typeof PAGE_CONFIG
