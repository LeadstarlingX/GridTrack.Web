import { Polyline } from 'react-leaflet'
import { useFocusStore } from '@/store/focusStore'

export default function RoutePolyline() {
    const polyline = useFocusStore((s) => s.routePolyline)

    if (!polyline || polyline.length === 0) return null

    return (
        <Polyline
            positions={polyline}
            pathOptions={{ color: '#f59e0b', weight: 4, opacity: 0.8, dashArray: '8 8' }}
        />
    )
}