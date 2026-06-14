import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { apiClient } from '../client'
import { APP_CONFIG } from '@/config/app.config'
import type { AnomalyType } from '@/types/api'

function path(template: string, id: string) {
    return template.replace('{id}', id)
}

function invalidateDelivery(queryClient: ReturnType<typeof useQueryClient>, id: string) {
    queryClient.invalidateQueries({ queryKey: ['delivery', id] })
    queryClient.invalidateQueries({ queryKey: ['delivery-timeline', id] })
    queryClient.invalidateQueries({ queryKey: ['deliveries'] })
}

export function useAssignDriver(deliveryId: string | null, onSuccess?: () => void) {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: (driverId: string) =>
            apiClient.post(path(APP_CONFIG.api.deliveryAssignPath, deliveryId!), { driverId }),
        onSuccess: () => {
            toast.success('Driver assigned.')
            invalidateDelivery(queryClient, deliveryId!)
            onSuccess?.()
        },
        onError: () => toast.error('Failed to assign driver.'),
    })
}

export function usePickUpDelivery(deliveryId: string | null, onSuccess?: () => void) {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: () =>
            apiClient.post(path(APP_CONFIG.api.deliveryPickUpPath, deliveryId!), {
                lat: APP_CONFIG.map.center[0],
                lng: APP_CONFIG.map.center[1],
            }),
        onSuccess: () => {
            toast.success('Delivery picked up.')
            invalidateDelivery(queryClient, deliveryId!)
            onSuccess?.()
        },
        onError: () => toast.error('Failed to mark as picked up.'),
    })
}

export function useMarkDelivered(deliveryId: string | null, onSuccess?: () => void) {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: () =>
            apiClient.post(path(APP_CONFIG.api.deliveryDeliveredPath, deliveryId!)),
        onSuccess: () => {
            toast.success('Delivery marked as delivered.')
            invalidateDelivery(queryClient, deliveryId!)
            onSuccess?.()
        },
        onError: () => toast.error('Failed to mark as delivered.'),
    })
}

export function useCancelDelivery(deliveryId: string | null, onSuccess?: () => void) {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: (reason: string) =>
            apiClient.post(path(APP_CONFIG.api.deliveryCancelPath, deliveryId!), { reason }),
        onSuccess: () => {
            toast.success('Delivery cancelled.')
            invalidateDelivery(queryClient, deliveryId!)
            onSuccess?.()
        },
        onError: () => toast.error('Failed to cancel delivery.'),
    })
}

export function useFlagAnomaly(deliveryId: string | null, onSuccess?: () => void) {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: ({ type, reason }: { type: AnomalyType; reason: string }) =>
            apiClient.post(path(APP_CONFIG.api.deliveryFlagAnomalyPath, deliveryId!), { type, reason }),
        onSuccess: () => {
            toast.success('Anomaly flagged.')
            invalidateDelivery(queryClient, deliveryId!)
            onSuccess?.()
        },
        onError: () => toast.error('Failed to flag anomaly.'),
    })
}
