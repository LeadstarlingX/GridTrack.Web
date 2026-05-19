import { Polyline } from 'react-leaflet'
import { APP_CONFIG } from '@/config/app.config'
import { useFocusStore } from '@/store/focusStore'

export default function RoutePolyline() {
    const polyline = useFocusStore((s) => s.routePolyline)

    if (!polyline || polyline.length === 0) return null

    return (
        <Polyline
            positions={polyline}
            pathOptions={APP_CONFIG.map.routePolyline}
            interactive={false}
        />
    )
}