export const APP_CONFIG = {
    map: {
        center: [33.5138, 36.2765] as [number, number],
        defaultZoom: 12,
        focusZoom: 15,
        flyToDurationSec: 1.2,
        hexResolution: {
            default: 8,
            min: 7,
            max: 10,
            devMax: 10,
            highResEnvFlag: 'VITE_ENABLE_HIGH_RES',
        },
        heatmapResolution: 8,
        h3FilePattern: '/h3-damascus-r{res}.geojson',
        districtBoundariesFile: '/damascus_level10.geojson',
    },
    signalr: {
        reconnectDelaysMs: [0, 2000, 5000, 10000, 30000],
        disconnectFatalAfterMs: 30000,
    },
    mock: {
        positionTickMs: 1000,
        deliveryPatchMs: 10000,
        anomalyInjectMs: 15000,
        avgSpeedMps: 8.3,
    },
    store: {
        anomalyQueueLimit: 50,
    },
    chatbot: {
        csvMaxChars: 80000,
    },
    query: {
        staleTimeMs: 60000,
        retry: 1,
        historicalHeatmapStaleTimeMs: 300000,
    },
    toast: {
        anomalyDurationMs: 8000,
    },
    table: {
        defaultPageSize: 6,
        driversPageSize: 8,
    },
    analytics: {
        defaultRangeDays: 7,
        defaultHourStart: 6,
        defaultHourEnd: 22,
        minHour: 0,
        maxHour: 23,
        quickRangesDays: [7, 30],
    },
    export: {
        csvFilenamePrefix: 'gridtrack-export',
    },
    recommendation: {
        understaffedThreshold: 0.85,
        overstaffedThreshold: 1.15,
        severelyUnderstaffedThreshold: 0.5,
    },
} as const
