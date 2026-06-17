import { memo, useMemo } from 'react'
import { Marker, Tooltip } from 'react-leaflet'
import L from 'leaflet'
import { useShallow } from 'zustand/react/shallow'
import { useLiveStore } from '@/store/liveStore'
import { useFocusStore } from '@/store/focusStore'
import { useMapStore } from '@/store/mapStore'
import { getMapRef } from '@/lib/mapRef'

function buildIcon(opts: { isFocused: boolean; isDimmed: boolean; isStalled: boolean; status: string }) {
    const { isFocused, isDimmed, isStalled, status } = opts
    const size = isFocused ? 18 : 12
    const half = size / 2

    const color = isFocused
        ? '#f59e0b'
        : isStalled
        ? '#f97316'
        : status === 'available'
        ? '#22c55e'
        : status === 'offline'
        ? '#94a3b8'
        : '#3b82f6'

    const dot = `<div style="
        width:${size}px; height:${size}px;
        background:${color};
        border-radius:50%;
        border:2px solid white;
        box-shadow:0 1px 3px rgba(0,0,0,0.4);
        transition: opacity 300ms ease, transform 300ms ease;
        transform: scale(${isFocused ? 1.5 : 1});
    "></div>`

    const ring = isStalled && !isFocused
        ? `<div class="driver-stall-ring" style="
            position:absolute;
            top:${-half - 2}px; left:${-half - 2}px;
            width:${size + 8}px; height:${size + 8}px;
            border:2px solid #f97316;
            border-radius:50%;
        "></div>`
        : ''

    const containerSize = isStalled && !isFocused ? size + 16 : size

    return L.divIcon({
        className: isDimmed ? 'dimmed' : '',
        html: `<div style="position:relative; width:${size}px; height:${size}px;">${dot}${ring}</div>`,
        iconSize: [containerSize, containerSize],
        iconAnchor: [containerSize / 2, containerSize / 2],
    })
}

// Subscribes to a single driver — only re-renders when that driver's data changes.
const DriverMarkerItem = memo(function DriverMarkerItem({
    id,
    focusedDriverId,
    toggleDriverPanel,
}: {
    id: string
    focusedDriverId: string | null
    toggleDriverPanel: (id: string) => void
}) {
    const d = useLiveStore((s) => s.drivers[id])

    const isFocused = id === focusedDriverId
    const isDimmed = focusedDriverId !== null && !isFocused
    const isStalled = d ? d.stalledSince !== null : false
    const status = d ? d.status : 'in-transit'

    // Memoize the icon so that L.divIcon + HTML string construction only runs
    // when visual properties change — not on every lat/lng position update.
    const icon = useMemo(
        () => buildIcon({ isFocused, isDimmed, isStalled, status }),
        [isFocused, isDimmed, isStalled, status],
    )

    if (!d) return null

    return (
        <Marker
            position={[d.lat, d.lng]}
            icon={icon}
            zIndexOffset={isFocused ? 1000 : isStalled ? 500 : 0}
            eventHandlers={{
                click: () => {
                    toggleDriverPanel(id)
                    getMapRef()?.flyTo([d.lat, d.lng], 15, { animate: true, duration: 0.6 })
                },
            }}
        >
            <Tooltip
                direction="top"
                offset={[0, -8]}
                opacity={0.92}
                className="!border-0 !bg-[hsl(var(--surface))] !text-[hsl(var(--foreground))] !text-xs !px-2 !py-1 !shadow-md !rounded-md"
            >
                <span className="font-medium">{d.name}</span>
                <span className="ml-1 text-[hsl(var(--foreground-muted))]">· {d.status}</span>
            </Tooltip>
        </Marker>
    )
})

// Subscribes to driver IDs only — stable when positions change, re-renders only on join/leave.
export default function DriverMarkers() {
    const driverIds = useLiveStore(useShallow((s) => Object.keys(s.drivers)))
    const focusedDriverId = useFocusStore((s) => s.focusedDriverId)
    const toggleDriverPanel = useMapStore((s) => s.toggleDriverPanel)

    return (
        <>
            {driverIds.map((id) => (
                <DriverMarkerItem
                    key={id}
                    id={id}
                    focusedDriverId={focusedDriverId}
                    toggleDriverPanel={toggleDriverPanel}
                />
            ))}
        </>
    )
}
