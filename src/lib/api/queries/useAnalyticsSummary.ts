import { useQuery } from '@tanstack/react-query'
import { apiClient } from '../client'
import { APP_CONFIG } from '@/config/app.config'
import type { AnalyticsSummaryDto } from '@/types/api'

export function useAnalyticsSummary() {
    return useQuery({
        queryKey: ['analytics-summary'],
        queryFn: () =>
            apiClient.get<AnalyticsSummaryDto>(APP_CONFIG.api.analyticsSummaryPath).then((r) => r.data),
    })
}
