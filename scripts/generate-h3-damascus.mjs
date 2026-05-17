import { polygonToCells, cellToBoundary } from 'h3-js'
import { writeFileSync } from 'fs'

const damascusBbox = [
    [36.15, 33.40],[36.45, 33.40],[36.45, 33.65],[36.15, 33.65],[36.15, 33.40],
]

const cells = polygonToCells(damascusBbox, 8)

const features = cells.map(cell => {
    const boundary = cellToBoundary(cell)
    return {
        type: 'Feature',
        properties: { h3Index: cell },
        geometry: {
            type: 'Polygon',
            coordinates: [[...boundary.map(([lat, lng]) => [lng, lat]), [boundary[0][1], boundary[0][0]]]],
        },
    }
})

writeFileSync('public/h3-damascus.geojson', JSON.stringify({ type: 'FeatureCollection', features }))
console.log(`Generated ${features.length} H3 cells`)