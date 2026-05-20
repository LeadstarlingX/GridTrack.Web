import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { apiClient } from '../client'
import { APP_CONFIG } from '@/config/app.config'
import type { DriverAvailabilityRequest, DriverAvailabilityResponse } from '@/types/api'

export function useDriverAvailability() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: ({ id, status }: { id: string; status: 'available' | 'offline' }) =>
            apiClient
                .patch<DriverAvailabilityResponse>(
                    APP_CONFIG.api.driverAvailabilityPath.replace('{id}', id),
                    { status } satisfies DriverAvailabilityRequest,
                )
                .then((r) => r.data),
        onSuccess: (data) => {
            toast.success(`Driver set to ${data.status}.`)
            queryClient.invalidateQueries({ queryKey: ['drivers'] })
        },
    })
}
