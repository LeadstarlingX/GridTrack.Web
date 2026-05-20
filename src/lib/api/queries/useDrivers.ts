import { useInfiniteQuery } from '@tanstack/react-query'
import { apiClient } from '../client'
import { APP_CONFIG } from '@/config/app.config'
import type { PagedResponse, DriverListItemDto, DriversQueryParams } from '@/types/api'

export function useDrivers(params: Omit<DriversQueryParams, 'cursor'>) {
    return useInfiniteQuery({
        queryKey: ['drivers', params],
        queryFn: ({ pageParam }) =>
            apiClient
                .get<PagedResponse<DriverListItemDto>>(APP_CONFIG.api.driversPath, {
                    params: { ...params, cursor: pageParam },
                })
                .then((r) => r.data),
        initialPageParam: undefined as string | undefined,
        getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    })
}
