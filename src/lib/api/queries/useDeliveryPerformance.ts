import { useQuery } from '@tanstack/react-query'
import { apiClient } from '../client'
import { APP_CONFIG } from '@/config/app.config'
import type { DeliveryPerformanceDto } from '@/types/api'

export function useDeliveryPerformance(from?: string, to?: string) {
    return useQuery({
        queryKey: ['analytics-delivery-performance', from, to],
        queryFn: () => {
            const search = new URLSearchParams()
            if (from) search.set('from', from)
            if (to) search.set('to', to)
            const qs = search.toString()
            const url = `${APP_CONFIG.api.analyticsDeliveryPerformancePath}${qs ? `?${qs}` : ''}`
            return apiClient.get<DeliveryPerformanceDto>(url).then((r) => r.data)
        },
        staleTime: 30_000,
    })
}
