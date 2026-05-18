import { polygonToCells, cellToBoundary } from 'h3-js'
import { writeFileSync } from 'fs'

const damascusBbox = [
    [33.40, 36.15],
    [33.65, 36.15],
    [33.65, 36.45],
    [33.40, 36.45],
    [33.40, 36.15],
]

const resolutions = [7, 8, 9, 10, 11]

resolutions.forEach((resolution) => {
    const cells = polygonToCells(damascusBbox, resolution)

    const features = cells.map((cell) => {
        const boundary = cellToBoundary(cell)
        return {
            type: 'Feature',
            properties: { h3Index: cell },
            geometry: {
                type: 'Polygon',
                coordinates: [[...boundary, boundary[0]]],
            },
        }
    })

    writeFileSync(
        `public/h3-damascus-r${resolution}.geojson`,
        JSON.stringify({ type: 'FeatureCollection', features })
    )
    console.log(`Generated r${resolution} with ${features.length} H3 cells`)
})