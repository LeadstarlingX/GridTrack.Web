import { Marker } from 'react-leaflet'
import L from 'leaflet'
import { useLiveStore } from '@/store/liveStore'
import { useFocusStore } from '@/store/focusStore'
import { useMapStore } from '@/store/mapStore'

export default function DriverMarkers() {
    const drivers = useLiveStore((s) => s.drivers)
    const focusedDriverId = useFocusStore((s) => s.focusedDriverId)
    const selectDriver = useMapStore((s) => s.selectDriver)
    const setSidePanelMode = useMapStore((s) => s.setSidePanelMode)

    return (
        <>
            {Object.values(drivers).map((d) => {
                const isFocused = d.id === focusedDriverId
                const isDimmed = focusedDriverId !== null && !isFocused

                const icon = L.divIcon({
                    className: isDimmed ? 'dimmed' : '',
                    html: `<div style="
            width:${isFocused ? 18 : 12}px;
            height:${isFocused ? 18 : 12}px;
            background:${isFocused ? '#f59e0b' : d.status === 'available' ? '#22c55e' : d.status === 'offline' ? '#94a3b8' : '#3b82f6'};
            border-radius:50%;
            border:2px solid white;
            box-shadow:0 1px 3px rgba(0,0,0,0.4);
            transition: opacity 300ms ease, transform 300ms ease;
            transform: scale(${isFocused ? 1.5 : 1});
          "></div>`,
                    iconSize: [isFocused ? 18 : 12, isFocused ? 18 : 12],
                    iconAnchor: [isFocused ? 9 : 6, isFocused ? 9 : 6],
                })

                return (
                    <Marker
                        key={d.id}
                        position={[d.lat, d.lng]}
                        icon={icon}
                        zIndexOffset={isFocused ? 1000 : 0}
                        eventHandlers={{
                            click: () => {
                                selectDriver(d.id)
                                setSidePanelMode('driver')
                            },
                        }}
                    />
                )
            })}
        </>
    )
}