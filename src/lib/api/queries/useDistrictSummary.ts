import { useQuery } from '@tanstack/react-query'
import { apiClient } from '../client'
import { APP_CONFIG } from '@/config/app.config'
import type { DistrictSummaryDto } from '@/types/api'

export function useDistrictSummary(districtId: string | null) {
    return useQuery({
        queryKey: ['district-summary', districtId],
        queryFn: () =>
            apiClient
                .get<DistrictSummaryDto>(
                    APP_CONFIG.api.aiDistrictSummaryPath.replace('{id}', districtId!),
                )
                .then((r) => r.data),
        enabled: districtId !== null,
        staleTime: 120_000,
    })
}
