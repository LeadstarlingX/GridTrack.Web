import { useQuery } from '@tanstack/react-query'
import { apiClient } from '../client'
import { APP_CONFIG } from '@/config/app.config'

export interface ForecastTrendPoint {
    bucket: string
    value: number
}

export function useSarimaDeliveryForecast(days = 3) {
    return useQuery({
        queryKey: ['sarima-delivery-forecast', days],
        queryFn: () =>
            apiClient
                .get<ForecastTrendPoint[]>(`${APP_CONFIG.api.deliveryTrendForecastPath}?days=${days}`)
                .then((r) => r.data),
        staleTime: 1000 * 60 * 30, // SARIMA refit is expensive — cache 30 min
    })
}
