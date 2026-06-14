import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { apiClient } from '../client'
import { APP_CONFIG } from '@/config/app.config'
import type { AutoAssignResponseDto } from '@/types/api'

function invalidateDelivery(queryClient: ReturnType<typeof useQueryClient>, id: string) {
    queryClient.invalidateQueries({ queryKey: ['delivery', id] })
    queryClient.invalidateQueries({ queryKey: ['delivery-timeline', id] })
    queryClient.invalidateQueries({ queryKey: ['deliveries'] })
}

export function useAutoAssign(deliveryId: string | null) {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: () =>
            apiClient
                .post<AutoAssignResponseDto>(
                    APP_CONFIG.api.deliveryAutoAssignPath.replace('{id}', deliveryId!),
                )
                .then((r) => r.data),
        onSuccess: (data) => {
            if (data.autoAssigned) {
                toast.success('Driver auto-assigned.')
                invalidateDelivery(queryClient, deliveryId!)
            }
        },
        onError: () => toast.error('Auto-assign failed.'),
    })
}
