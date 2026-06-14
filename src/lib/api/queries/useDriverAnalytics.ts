import { useQuery } from '@tanstack/react-query'
import { apiClient } from '../client'
import { APP_CONFIG } from '@/config/app.config'
import type { DriverAnalyticsResponseDto } from '@/types/api'

export function useDriverAnalytics() {
    return useQuery({
        queryKey: ['analytics-drivers'],
        queryFn: () =>
            apiClient
                .get<DriverAnalyticsResponseDto>(APP_CONFIG.api.analyticsDriversPath)
                .then((r) => r.data),
        staleTime: 60_000,
    })
}
