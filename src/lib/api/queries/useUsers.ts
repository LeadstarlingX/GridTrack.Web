import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/api/client'
import type { UserDto } from '@/types/api'

export function useUsers() {
    return useQuery({
        queryKey: ['users'],
        queryFn: async () => {
            const res = await apiClient.get<UserDto[]>('/api/users')
            return res.data
        },
    })
}
