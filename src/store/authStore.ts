import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type UserRole = 'Observer' | 'GeneralObserver'

interface AuthState {
    token:       string | null
    userId:      string | null
    role:        UserRole | null
    districtIds: string[]   // H3 strings for SQL filtering
    sectorIds:   string[]   // DistrictGroup UUIDs for SignalR

    login:  (token: string) => void
    logout: () => void
    isAuthenticated: () => boolean
}

function parseJwtPayload(token: string): Omit<AuthState, 'token' | 'login' | 'logout' | 'isAuthenticated'> {
    try {
        const b64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')
        const json = JSON.parse(atob(b64)) as Record<string, unknown>

        const toArray = (v: unknown): string[] =>
            Array.isArray(v) ? (v as string[]) : v ? [v as string] : []

        return {
            // .NET JwtSecurityTokenHandler maps ClaimTypes.NameIdentifier → "nameid"
            userId:      String(json['nameid'] ?? json['sub'] ?? ''),
            role:        (json['role'] as UserRole) ?? null,
            districtIds: toArray(json['districtId']),
            sectorIds:   toArray(json['sectorId']),
        }
    } catch {
        return { userId: null, role: null, districtIds: [], sectorIds: [] }
    }
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set, get) => ({
            token:       null,
            userId:      null,
            role:        null,
            districtIds: [],
            sectorIds:   [],

            login: (token) => set({ token, ...parseJwtPayload(token) }),
            logout: () => set({ token: null, userId: null, role: null, districtIds: [], sectorIds: [] }),
            isAuthenticated: () => get().token !== null,
        }),
        {
            name: 'gridtrack-auth',
            // Only persist the token — re-derive the rest on rehydrate via onRehydrateStorage
            partialize: (s) => ({ token: s.token }),
            onRehydrateStorage: () => (state) => {
                if (state?.token) {
                    const parsed = parseJwtPayload(state.token)
                    Object.assign(state, parsed)
                }
            },
        },
    ),
)