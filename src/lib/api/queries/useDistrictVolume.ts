import { useQuery } from '@tanstack/react-query'
import { apiClient } from '../client'
import { APP_CONFIG } from '@/config/app.config'
import type { DistrictVolumeDto, DistrictVolumeQueryParams } from '@/types/api'

export function useDistrictVolume(params?: DistrictVolumeQueryParams) {
    return useQuery({
        queryKey: ['analytics-district-volume', params],
        queryFn: () =>
            apiClient
                .get<DistrictVolumeDto>(APP_CONFIG.api.analyticsDistrictVolumePath, { params })
                .then((r) => r.data),
    })
}
