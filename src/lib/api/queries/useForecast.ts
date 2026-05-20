import { useQuery } from '@tanstack/react-query'
import { apiClient } from '../client'
import { APP_CONFIG } from '@/config/app.config'
import type { ForecastDto } from '@/types/api'

export function useForecast(districtId: string | null) {
    return useQuery({
        queryKey: ['forecast', districtId],
        queryFn: () =>
            apiClient
                .get<ForecastDto>(APP_CONFIG.api.forecastPath.replace('{districtId}', districtId!))
                .then((r) => r.data),
        enabled: districtId !== null,
    })
}
