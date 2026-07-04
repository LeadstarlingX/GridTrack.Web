import { useQuery } from '@tanstack/react-query'
import { apiClient } from '../client'
import { APP_CONFIG } from '@/config/app.config'
import type { DeliveryDetailDto } from '@/types/api'

export function useDelivery(id: string | null) {
    return useQuery({
        queryKey: ['delivery', id],
        queryFn: () =>
            apiClient
                .get<DeliveryDetailDto>(APP_CONFIG.api.deliveryDetailPath.replace('{id}', id!))
                .then((r) => r.data),
        enabled: id !== null,
        staleTime: 30_000, // prevent immediate background refetch on remount overwriting valid etaSeconds
    })
}
