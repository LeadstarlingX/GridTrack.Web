import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { apiClient } from '@/lib/api/client'
import type { DistrictGroupDto } from '@/types/api'

export function useCreateDistrictGroup() {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: (body: { name: string; districtIds: string[] }) =>
            apiClient.post<DistrictGroupDto>('/api/district-groups', body).then((r) => r.data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['district-groups'] })
            toast.success('Sector created')
        },
        onError: () => toast.error('Failed to create sector'),
    })
}

export function useUpdateDistrictGroup() {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: ({ id, ...body }: { id: string; name: string; districtIds: string[] }) =>
            apiClient.put<DistrictGroupDto>(`/api/district-groups/${id}`, body).then((r) => r.data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['district-groups'] })
            toast.success('Sector updated')
        },
        onError: () => toast.error('Failed to update sector'),
    })
}

export function useDeleteDistrictGroup() {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: (id: string) => apiClient.delete(`/api/district-groups/${id}`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['district-groups'] })
            toast.success('Sector deleted')
        },
        onError: () => toast.error('Failed to delete sector'),
    })
}
