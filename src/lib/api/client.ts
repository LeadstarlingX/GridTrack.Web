import axios from 'axios'
import { toast } from 'sonner'
import { getAuthToken, signOutUser } from './authBridge'
import type { ApiError } from '@/types/api'

export class AppError extends Error {
    constructor(
        public readonly code: string,
        message: string,
        public readonly traceId?: string,
    ) {
        super(message)
        this.name = 'AppError'
    }
}

const USER_FRIENDLY: Record<string, string> = {
    DELIVERY_NOT_FOUND: 'Delivery not found.',
    DRIVER_NOT_FOUND: 'Driver not found.',
    DISTRICT_NOT_FOUND: 'District not found.',
    UNAUTHORIZED: 'Your session has expired. Please sign in again.',
    FORBIDDEN: 'You do not have permission for this action.',
    RATE_LIMITED: 'Too many requests — try again shortly.',
    VALIDATION_ERROR: 'Invalid request. Please check your inputs.',
}

function resolveMessage(code: string, serverMessage: string): string {
    return USER_FRIENDLY[code] ?? serverMessage ?? 'An unexpected error occurred.'
}

export const apiClient = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL ?? '',
    timeout: 10_000,
    headers: { 'Content-Type': 'application/json' },
})

// Attach Clerk JWT on every request
apiClient.interceptors.request.use(async (config) => {
    const token = await getAuthToken()
    if (token) config.headers.Authorization = `Bearer ${token}`
    return config
})

// Normalize errors → AppError + show toast
apiClient.interceptors.response.use(
    (response) => response,
    async (error) => {
        if (!error.response) {
            if (error.code === 'ECONNABORTED') {
                toast.error('Request timed out. Check your connection and try again.')
            }
            throw error
        }

        const { status, data } = error.response as { status: number; data: Partial<ApiError> }
        const code = data?.code ?? 'UNKNOWN'
        const message = resolveMessage(code, data?.message ?? '')

        if (status === 401) {
            await signOutUser()
            return
        }

        if (status === 403) {
            toast.error(resolveMessage(code, 'You do not have permission for this action.'))
        } else if (status === 429) {
            toast.warning('Too many requests — try again shortly.')
        } else if (status >= 500) {
            toast.error('Server error — our team has been notified.')
        }

        throw new AppError(code, message, data?.traceId)
    },
)

// Persistent offline/online banner
if (typeof window !== 'undefined') {
    window.addEventListener('offline', () => {
        toast.warning('You are offline. Live data is paused.', {
            id: 'network-offline',
            duration: Infinity,
        })
    })
    window.addEventListener('online', () => {
        toast.dismiss('network-offline')
    })
}
