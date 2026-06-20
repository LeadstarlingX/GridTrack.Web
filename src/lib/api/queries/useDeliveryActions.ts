import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { apiClient } from '../client'
import { APP_CONFIG } from '@/config/app.config'
import type { AnomalyType } from '@/types/api'

export interface CreateDeliveryPayload {
    lat: number
    lng: number
    districtId?: string
    expectedEta?: string | null
}

export function useCreateDelivery(onSuccess?: (deliveryId: string) => void) {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: (data: CreateDeliveryPayload) =>
            apiClient
                .post<{ deliveryId: string; districtId: string; createdAt: string }>(
                    APP_CONFIG.api.deliveriesPath,
                    data,
                )
                .then((r) => r.data),
        onSuccess: (data) => {
            toast.success('Delivery created.')
            queryClient.invalidateQueries({ queryKey: ['deliveries'] })
            onSuccess?.(data.deliveryId)
        },
        onError: () => toast.error('Failed to create delivery.'),
    })
}

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
