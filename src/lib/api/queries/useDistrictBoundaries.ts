import { useQuery } from '@tanstack/react-query'
import { apiClient } from '../client'
import { APP_CONFIG } from '@/config/app.config'

export function useDistrictBoundaries(options?: { enabled?: boolean }) {
    return useQuery({
        queryKey: ['district-boundaries'],
        queryFn: () =>
            apiClient
                .get<GeoJSON.FeatureCollection>(APP_CONFIG.api.districtBoundariesPath)
                .then((r) => r.data),
        staleTime: Infinity,
        enabled: options?.enabled ?? true,
    })
}
