import { Source, Layer } from 'react-map-gl/maplibre'
import { useMemo } from 'react'
import { useLiveStore } from '@/store/liveStore'
import { useDistricts } from '@/lib/api/queries/useDistricts'

export default function DistrictDeliveryBadges() {
    const deliveries    = useLiveStore((s) => s.deliveries)
    const { data: allDistricts = [] } = useDistricts()

    const countsByDistrict = useMemo(() => {
        const map: Record<string, { count: number; hasAnomaly: boolean }> = {}
        for (const d of Object.values(deliveries)) {
            if (d.status === 'Delivered' || !d.districtId) continue
            const entry = map[d.districtId] ?? { count: 0, hasAnomaly: false }
            entry.count += 1
            if (d.status === 'Anomalous') entry.hasAnomaly = true
            map[d.districtId] = entry
        }
        return map
    }, [deliveries])

    const badgesGeoJSON: GeoJSON.FeatureCollection = useMemo(() => ({
        type: 'FeatureCollection',
        features: allDistricts
            .filter((d) => (countsByDistrict[d.id]?.count ?? 0) > 0)
            .map((d) => ({
                type: 'Feature' as const,
                geometry: { type: 'Point' as const, coordinates: [d.centroid.lng, d.centroid.lat] },
                properties: {
                    count: countsByDistrict[d.id].count,
                    hasAnomaly: countsByDistrict[d.id].hasAnomaly,
                },
            })),
    }), [allDistricts, countsByDistrict])

    return (
        <Source id="district-badges" type="geojson" data={badgesGeoJSON}>
            <Layer
                id="district-badge-labels"
                type="symbol"
                layout={{
                    'text-field': ['to-string', ['get', 'count']],
                    'text-size': 11,
                    'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold'],
                    'text-allow-overlap': true,
                    'text-ignore-placement': true,
                }}
                paint={{
                    'text-color': '#ffffff',
                    'text-halo-color': ['case', ['get', 'hasAnomaly'], '#f97316', '#3b82f6'],
                    'text-halo-width': 6,
                }}
            />
        </Source>
    )
}
