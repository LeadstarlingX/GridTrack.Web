import { useQuery } from '@tanstack/react-query'
import { apiClient } from '../client'
import { APP_CONFIG } from '@/config/app.config'
import type { DriverDetailDto } from '@/types/api'

export function useDriverDetail(id: string | null) {
    return useQuery({
        queryKey: ['driver-detail', id],
        queryFn: () =>
            apiClient
                .get<DriverDetailDto>(APP_CONFIG.api.driverDetailPath.replace('{id}', id!))
                .then((r) => r.data),
        enabled: id !== null,
        staleTime: 60_000,
    })
}
