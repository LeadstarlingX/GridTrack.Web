import { useQuery } from '@tanstack/react-query'
import { apiClient } from '../client'
import { APP_CONFIG } from '@/config/app.config'
import type { AnalyticsSummaryDto } from '@/types/api'

interface SummaryParams {
    from?: string
    to?: string
}

export function useAnalyticsSummary(params?: SummaryParams) {
    const { from, to } = params ?? {}
    return useQuery({
        queryKey: ['analytics-summary', from, to],
        queryFn: () => {
            const search = new URLSearchParams()
            if (from) search.set('from', from)
            if (to) search.set('to', to)
            const qs = search.toString()
            const url = `${APP_CONFIG.api.analyticsSummaryPath}${qs ? `?${qs}` : ''}`
            return apiClient.get<AnalyticsSummaryDto>(url).then((r) => r.data)
        },
        staleTime: 30_000,
    })
}
