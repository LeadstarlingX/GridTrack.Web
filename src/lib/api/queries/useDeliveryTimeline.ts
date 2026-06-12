import { useQuery } from '@tanstack/react-query'
import { apiClient } from '../client'
import { APP_CONFIG } from '@/config/app.config'
import type { DeliveryTimelineDto } from '@/types/api'

export function useDeliveryTimeline(id: string | null) {
    return useQuery({
        queryKey: ['delivery-timeline', id],
        queryFn: () =>
            apiClient
                .get<DeliveryTimelineDto>(APP_CONFIG.api.deliveryTimelinePath.replace('{id}', id!))
                .then((r) => r.data),
        enabled: id !== null,
        staleTime: 10_000,
    })
}
