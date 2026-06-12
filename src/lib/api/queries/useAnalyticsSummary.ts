import { useQuery } from '@tanstack/react-query'
import { apiClient } from '../client'
import { APP_CONFIG } from '@/config/app.config'
import type { AnalyticsSummaryDto } from '@/types/api'

interface SummaryParams {
    from: string
    to: string
}

export function useAnalyticsSummary(params?: SummaryParams) {
    return useQuery({
        queryKey: ['analytics-summary', params?.from, params?.to],
        queryFn: () => {
            const url = params
                ? `${APP_CONFIG.api.analyticsSummaryPath}?from=${params.from}&to=${params.to}`
                : APP_CONFIG.api.analyticsSummaryPath
            return apiClient.get<AnalyticsSummaryDto>(url).then((r) => r.data)
        },
        staleTime: 30_000,
    })
}
