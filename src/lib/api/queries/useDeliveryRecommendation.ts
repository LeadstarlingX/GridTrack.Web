import { useQuery } from '@tanstack/react-query'
import { apiClient } from '../client'
import { APP_CONFIG } from '@/config/app.config'
import type { DeliveryRecommendationDto } from '@/types/api'

export function useDeliveryRecommendation(deliveryId: string | null, enabled = true) {
    return useQuery({
        queryKey: ['ai-recommendation', deliveryId],
        queryFn: () =>
            apiClient
                .get<DeliveryRecommendationDto>(
                    APP_CONFIG.api.aiDeliveryRecommendationPath.replace('{id}', deliveryId!),
                )
                .then((r) => r.data),
        enabled: enabled && deliveryId !== null,
        staleTime: 60_000,
    })
}
