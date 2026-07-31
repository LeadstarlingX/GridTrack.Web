import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { apiClient } from '@/lib/api/client'
import type { UserDto } from '@/types/api'

export function useUpdateUserSectors() {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: ({ userId, sectorIds }: { userId: string; sectorIds: string[] }) =>
            apiClient
                .patch<UserDto>(`/api/users/${userId}/sectors`, { sectorIds })
                .then((r) => r.data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['users'] })
        },
        onError: () => toast.error('Failed to update sectors.'),
    })
}
