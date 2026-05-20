import { useInfiniteQuery } from '@tanstack/react-query'
import { apiClient } from '../client'
import { APP_CONFIG } from '@/config/app.config'
import type { PagedResponse, AnomalyAlertDto, AlertsQueryParams } from '@/types/api'

export function useAlerts(params: Omit<AlertsQueryParams, 'cursor'>) {
    return useInfiniteQuery({
        queryKey: ['alerts', params],
        queryFn: ({ pageParam }) =>
            apiClient
                .get<PagedResponse<AnomalyAlertDto>>(APP_CONFIG.api.alertsPath, {
                    params: { ...params, cursor: pageParam },
                })
                .then((r) => r.data),
        initialPageParam: undefined as string | undefined,
        getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    })
}
