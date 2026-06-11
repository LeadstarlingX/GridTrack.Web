import { useQuery } from '@tanstack/react-query'
import { apiClient } from '../client'

interface SparklinePoint { hour: string; count: number }

export function useDistrictSparkline(districtId: string | null, hours = 6) {
    return useQuery({
        queryKey: ['district-sparkline', districtId, hours],
        queryFn: () =>
            apiClient
                .get<SparklinePoint[]>(`/api/districts/${districtId}/sparkline?hours=${hours}`)
                .then((r) => r.data),
        enabled: districtId !== null,
        refetchInterval: 60_000,
    })
}
