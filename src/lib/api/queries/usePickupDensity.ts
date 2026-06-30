import { useQuery } from '@tanstack/react-query'
import { apiClient } from '../client'
import { APP_CONFIG } from '@/config/app.config'
import type { PickupDensityDto, PickupDensityQueryParams } from '@/types/api'

export function usePickupDensity(params: PickupDensityQueryParams | null) {
    return useQuery({
        queryKey: ['pickup-density', params],
        queryFn: () =>
            apiClient
                .get<PickupDensityDto>(APP_CONFIG.api.analyticsPickupDensityPath, { params: params! })
                .then((r) => r.data),
        staleTime: APP_CONFIG.query.historicalHeatmapStaleTimeMs,
        enabled: params !== null,
    })
}
