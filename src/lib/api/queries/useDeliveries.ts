import { useInfiniteQuery } from '@tanstack/react-query'
import { apiClient } from '../client'
import { APP_CONFIG } from '@/config/app.config'
import type { PagedResponse, DeliveryListItemDto, DeliveriesQueryParams } from '@/types/api'

export function useDeliveries(params: Omit<DeliveriesQueryParams, 'cursor'>) {
    return useInfiniteQuery({
        queryKey: ['deliveries', params],
        queryFn: ({ pageParam }) =>
            apiClient
                .get<PagedResponse<DeliveryListItemDto>>(APP_CONFIG.api.deliveriesPath, {
                    params: { ...params, cursor: pageParam },
                })
                .then((r) => r.data),
        initialPageParam: undefined as string | undefined,
        getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    })
}
