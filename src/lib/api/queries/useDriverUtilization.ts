import { useQuery } from '@tanstack/react-query'
import { apiClient } from '../client'
import { APP_CONFIG } from '@/config/app.config'
import type { DriverUtilizationDto } from '@/types/api'

export function useDriverUtilization(top = 10) {
    return useQuery({
        queryKey: ['analytics-driver-utilization', top],
        queryFn: () =>
            apiClient
                .get<DriverUtilizationDto>(`${APP_CONFIG.api.analyticsDriverUtilizationPath}?top=${top}`)
                .then((r) => r.data),
        staleTime: 30_000,
    })
}
