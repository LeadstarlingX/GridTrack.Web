import { useQuery } from '@tanstack/react-query'
import { apiClient } from '../client'
import { APP_CONFIG } from '@/config/app.config'
import type { AnalyticsTrendDto, TrendsQueryParams } from '@/types/api'

export function useAnalyticsTrends(params: TrendsQueryParams) {
    return useQuery({
        queryKey: ['analytics-trends', params],
        queryFn: () =>
            apiClient
                .get<AnalyticsTrendDto>(APP_CONFIG.api.analyticsTrendsPath, { params })
                .then((r) => r.data),
    })
}
