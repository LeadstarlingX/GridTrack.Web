import { useMemo } from 'react'
import { Marker } from 'react-leaflet'
import L from 'leaflet'
import { useLiveStore } from '@/store/liveStore'
import { useDistricts } from '@/lib/api/queries/useDistricts'

function buildBadgeIcon(count: number, hasAnomaly: boolean) {
    const bg = hasAnomaly ? '#f97316' : '#3b82f6'
    return L.divIcon({
        className: '',
        html: `<div style="
            background:${bg};
            color:#fff;
            border-radius:10px;
            padding:1px 6px;
            font-size:10px;
            font-weight:700;
            font-family:ui-monospace,monospace;
            white-space:nowrap;
            box-shadow:0 1px 3px rgba(0,0,0,0.35);
            border:1.5px solid rgba(255,255,255,0.3);
            line-height:16px;
        ">${count}</div>`,
        iconSize: [28, 18],
        iconAnchor: [14, 9],
    })
}

export default function DistrictDeliveryBadges() {
    const deliveries = useLiveStore((s) => s.deliveries)
    const { data: allDistricts = [] } = useDistricts()

    const countsByDistrict = useMemo(() => {
        const map: Record<string, { count: number; hasAnomaly: boolean }> = {}
        for (const d of Object.values(deliveries)) {
            if (d.status === 'Delivered') continue
            if (!d.districtId) continue
            const entry = map[d.districtId] ?? { count: 0, hasAnomaly: false }
            entry.count += 1
            if (d.status === 'Anomalous') entry.hasAnomaly = true
            map[d.districtId] = entry
        }
        return map
    }, [deliveries])

    return (
        <>
            {allDistricts.map((district) => {
                const entry = countsByDistrict[district.id]
                if (!entry || entry.count === 0) return null
                const icon = buildBadgeIcon(entry.count, entry.hasAnomaly)
                return (
                    <Marker
                        key={`badge-${district.id}`}
                        position={[district.centroid.lat, district.centroid.lng]}
                        icon={icon}
                        interactive={false}
                        zIndexOffset={-100}
                    />
                )
            })}
        </>
    )
}
