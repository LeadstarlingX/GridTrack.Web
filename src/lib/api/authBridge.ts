// Auth bridge — reads from the local JWT store so that apiClient and useSignalR
// need zero changes. setAuthBridge is kept as a no-op for backward compatibility
// with any code still calling it (providers.tsx will stop calling it).

import { useAuthStore } from '@/store/authStore'
import { queryClient } from '@/app/providers'

export function setAuthBridge(_fns: unknown) {
    // no-op — replaced by direct store reads
}

export async function getAuthToken(): Promise<string | null> {
    return useAuthStore.getState().token
}

export async function signOutUser(): Promise<void> {
    queryClient.clear()
    useAuthStore.getState().logout()
    window.location.href = '/sign-in'
}