import { useQuery } from '@tanstack/react-query'
import { apiClient } from '../client'
import { APP_CONFIG } from '@/config/app.config'
import type { DriverStatsDto } from '@/types/api'

export function useDriverStats(id: string | null) {
    return useQuery({
        queryKey: ['driver-stats', id],
        queryFn: () =>
            apiClient
                .get<DriverStatsDto>(APP_CONFIG.api.driverStatsPath.replace('{id}', id!))
                .then((r) => r.data),
        enabled: id !== null,
        staleTime: 30_000,
    })
}
