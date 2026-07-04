import type { Map as MaplibreMap } from 'maplibre-gl'

let mapInstance: MaplibreMap | null = null

export function setMapRef(map: MaplibreMap) {
    mapInstance = map
}

export function getMapRef(): MaplibreMap | null {
    return mapInstance
}
