import { useMemo } from 'react'
import { useDistricts } from './useDistricts'
import { useAuthStore } from '@/store/authStore'
import type { DistrictDto } from '@/types/api'

/**
 * Returns the district list scoped to the current user's sector.
 * GeneralObserver → all districts. Observer → only their allowed districts.
 */
export function useAllowedDistricts(): DistrictDto[] {
    const { data: all = [] } = useDistricts()
    const role        = useAuthStore((s) => s.role)
    const districtIds = useAuthStore((s) => s.districtIds)

    return useMemo(() => {
        if (role !== 'Observer') return all
        const allowed = new Set(districtIds)
        return all.filter((d) => allowed.has(d.id))
    }, [all, role, districtIds])
}
