import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/api/client'
import type { DistrictGroupDto } from '@/types/api'

export function useDistrictGroups() {
    return useQuery({
        queryKey: ['district-groups'],
        queryFn:  async () => {
            const res = await apiClient.get<DistrictGroupDto[]>('/api/district-groups')
            return res.data
        },
        staleTime: 5 * 60 * 1000, // groups change rarely
    })
}