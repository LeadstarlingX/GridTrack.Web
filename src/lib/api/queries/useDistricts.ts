import { useQuery } from '@tanstack/react-query'
import { apiClient } from '../client'
import { APP_CONFIG } from '@/config/app.config'
import type { DistrictDto } from '@/types/api'

export function useDistricts() {
    return useQuery({
        queryKey: ['districts'],
        queryFn: () =>
            apiClient.get<DistrictDto[]>(APP_CONFIG.api.districtsPath).then((r) => r.data),
        staleTime: Infinity,
    })
}
