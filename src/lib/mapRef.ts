import L from 'leaflet'

let mapInstance: L.Map | null = null

export function setMapRef(map: L.Map) {
    mapInstance = map
}

export function getMapRef() {
    return mapInstance
}
