function flag(envKey: string, defaultEnabled = true): boolean {
    const val = import.meta.env[envKey]
    if (val === undefined || val === '') return defaultEnabled
    return val !== 'false' && val !== '0'
}

export const PAGE_CONFIG = {
    liveOps:    flag('VITE_ENABLE_LIVE_OPS'),
    analytics:  flag('VITE_ENABLE_ANALYTICS'),
    deliveries: flag('VITE_ENABLE_DELIVERIES'),
    alerts:     flag('VITE_ENABLE_ALERTS'),
    drivers:    flag('VITE_ENABLE_DRIVERS'),
    settings:   flag('VITE_ENABLE_SETTINGS'),
    analyticsChatbot: {
        enabled: flag('VITE_ENABLE_ANALYTICS_CHATBOT', false),
        disabledMessage: 'AI analysis requires a Groq API key — set VITE_ENABLE_ANALYTICS_CHATBOT=true in Vercel once configured.',
    },
}

export type PageKey = keyof typeof PAGE_CONFIG
