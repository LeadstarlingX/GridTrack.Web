import { useQuery } from '@tanstack/react-query'
import { APP_CONFIG } from '@/config/app.config'
import { apiClient } from '@/lib/api/client'
import type { StaffingForecastResponse } from '@/types/api'

interface StaffingParams {
    districtId: string
    targetAt: string // ISO datetime
}

async function fetchStaffing(params: StaffingParams): Promise<StaffingForecastResponse> {
    const response = await apiClient.get<StaffingForecastResponse>(APP_CONFIG.api.staffingPath, {
        params,
    })
    return response.data
}

export function useStaffing(params: StaffingParams | null) {
    return useQuery({
        queryKey: ['staffing', params?.districtId, params?.targetAt],
        queryFn: () => fetchStaffing(params!),
        enabled: params !== null,
        staleTime: 5 * 60 * 1000,
        retry: 1,
    })
}
