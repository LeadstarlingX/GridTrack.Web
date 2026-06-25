import type { StyleSpecification } from 'maplibre-gl'

// Satellite basemap (like the previous Leaflet view): Esri World Imagery raster
// tiles with a light reference overlay for street/place labels. No API key needed.
// `glyphs` is required so symbol layers (e.g. district delivery badges) can render text.
export const SATELLITE_MAP_STYLE: StyleSpecification = {
    version: 8,
    glyphs: 'https://tiles.basemaps.cartocdn.com/fonts/{fontstack}/{range}.pbf',
    sources: {
        'esri-imagery': {
            type: 'raster',
            tiles: [
                'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
            ],
            tileSize: 256,
            attribution: 'Imagery © Esri, Maxar, Earthstar Geographics',
            maxzoom: 19,
        },
        'esri-reference': {
            type: 'raster',
            tiles: [
                'https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}',
            ],
            tileSize: 256,
            maxzoom: 19,
        },
    },
    layers: [
        { id: 'esri-imagery', type: 'raster', source: 'esri-imagery' },
        { id: 'esri-reference', type: 'raster', source: 'esri-reference', paint: { 'raster-opacity': 0.85 } },
    ],
}
