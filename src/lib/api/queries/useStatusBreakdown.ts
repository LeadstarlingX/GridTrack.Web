import { useQuery } from '@tanstack/react-query'
import { apiClient } from '../client'
import { APP_CONFIG } from '@/config/app.config'
import type { StatusBreakdownDto } from '@/types/api'

interface Params {
    from: string
    to: string
}

export function useStatusBreakdown(params?: Params) {
    return useQuery({
        queryKey: ['analytics-status-breakdown', params?.from, params?.to],
        queryFn: () => {
            const url = params
                ? `${APP_CONFIG.api.analyticsStatusBreakdownPath}?from=${params.from}&to=${params.to}`
                : APP_CONFIG.api.analyticsStatusBreakdownPath
            return apiClient.get<StatusBreakdownDto>(url).then((r) => r.data)
        },
        staleTime: 30_000,
    })
}
