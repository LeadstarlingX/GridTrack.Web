import { useQuery } from '@tanstack/react-query'
import { apiClient } from '../client'
import { APP_CONFIG } from '@/config/app.config'
import type { H3DensityDto, H3DensityQueryParams } from '@/types/api'

export function useH3Density(params: H3DensityQueryParams | null) {
    return useQuery({
        queryKey: ['h3-density', params],
        queryFn: () =>
            apiClient
                .get<H3DensityDto>(APP_CONFIG.api.analyticsH3DensityPath, { params: params! })
                .then((r) => r.data),
        staleTime: APP_CONFIG.query.historicalHeatmapStaleTimeMs,
        enabled: params !== null,
    })
}
