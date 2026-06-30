import { useQuery } from '@tanstack/react-query'
import { apiClient } from '../client'
import { APP_CONFIG } from '@/config/app.config'
import type { DistrictDemandForecastDto, DistrictDemandForecastQueryParams } from '@/types/api'

export function useDistrictDemandForecast(params: DistrictDemandForecastQueryParams) {
    return useQuery({
        queryKey: ['analytics-district-demand-forecast', params],
        queryFn: () =>
            apiClient
                .get<DistrictDemandForecastDto>(APP_CONFIG.api.analyticsDistrictDemandForecastPath, { params })
                .then((r) => r.data),
        staleTime: 60_000,
    })
}
