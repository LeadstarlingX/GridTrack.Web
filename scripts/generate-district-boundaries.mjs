import fs from 'node:fs/promises'
import path from 'node:path'
import osmtogeojson from 'osmtogeojson'
import * as h3 from 'h3-js'

const DEFAULT_RESOLUTION = 10
const DEFAULT_OUTPUT = path.join('public', 'district-boundaries.geojson')
const DEFAULT_ADM1_FIELD = 'adm1_name'
const DEFAULT_NAME_FIELD = 'adm2_name'
const OVERPASS_URLS = [
    'https://overpass-api.de/api/interpreter',
    'https://overpass.kumi.systems/api/interpreter',
    'https://overpass.nchc.org.tw/api/interpreter',
]

function parseArgs() {
    const args = process.argv.slice(2)
    const config = {
        resolution: DEFAULT_RESOLUTION,
        output: DEFAULT_OUTPUT,
        source: null,
        adm1: [],
        adm1Field: DEFAULT_ADM1_FIELD,
        nameField: DEFAULT_NAME_FIELD,
        idField: null,
    }
    for (const arg of args) {
        if (arg.startsWith('--resolution=')) {
            const value = Number(arg.split('=')[1])
            if (!Number.isNaN(value)) config.resolution = value
        }
        if (arg.startsWith('--output=')) {
            config.output = arg.split('=')[1]
        }
        if (arg.startsWith('--source=')) {
            config.source = arg.split('=')[1]
        }
        if (arg.startsWith('--adm1=')) {
            const value = arg.split('=')[1]
            config.adm1 = value.split(',').map((item) => item.trim()).filter(Boolean)
        }
        if (arg.startsWith('--adm1-field=')) {
            config.adm1Field = arg.split('=')[1]
        }
        if (arg.startsWith('--name-field=')) {
            config.nameField = arg.split('=')[1]
        }
        if (arg.startsWith('--id-field=')) {
            config.idField = arg.split('=')[1]
        }
    }
    return config
}

function slugify(value) {
    return value
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '')
}

async function fetchOverpass(query) {
    const encoded = encodeURIComponent(query)
    let lastError = null

    for (const baseUrl of OVERPASS_URLS) {
        const url = `${baseUrl}?data=${encoded}`
        try {
            const response = await fetch(url, {
                headers: {
                    Accept: 'application/json',
                    'User-Agent': 'GridTrack-Web/1.0 (OSM boundary fetch)',
                },
            })
            if (!response.ok) {
                const text = await response.text()
                lastError = new Error(`Overpass error: ${response.status} ${response.statusText} - ${text}`)
                continue
            }
            return response.json()
        } catch (err) {
            lastError = err
        }
    }

    throw lastError ?? new Error('Overpass error: all endpoints failed')
}

function extractName(feature) {
    const tags = feature.properties?.tags ?? {}
    return tags['name:en'] || tags.name || feature.properties?.name || null
}

function pickProperty(feature, field) {
    if (!field) return null
    return feature.properties?.[field] ?? null
}

function cellsForGeometry(geometry, resolution) {
    if (geometry.type === 'Polygon') {
        return h3.polygonToCells(geometry.coordinates, resolution, true)
    }
    if (geometry.type === 'MultiPolygon') {
        return geometry.coordinates.flatMap((poly) => h3.polygonToCells(poly, resolution, true))
    }
    return []
}

function toBoundaryFeature(feature, resolution, fields) {
    const name = fields?.nameField ? pickProperty(feature, fields.nameField) : extractName(feature)
    if (!name) return null

    const cells = new Set(cellsForGeometry(feature.geometry, resolution))
    if (cells.size === 0) return null

    const multiPolygon = h3.cellsToMultiPolygon([...cells], true)
    const rawId = fields?.idField ? pickProperty(feature, fields.idField) : null
    const districtId = rawId ? `district-${slugify(String(rawId))}` : `district-${slugify(String(name))}`

    return {
        type: 'Feature',
        properties: {
            districtId,
            name,
        },
        geometry: {
            type: 'MultiPolygon',
            coordinates: multiPolygon,
        },
    }
}

async function main() {
    const { resolution, output, source, adm1, adm1Field, nameField, idField } = parseArgs()
    const query = [
        '[out:json][timeout:180];',
        'area["name"="Damascus"]["boundary"="administrative"]->.damascus;',
        'relation["boundary"="administrative"]["admin_level"="8"](area.damascus);',
        'out geom;',
    ].join('\n')

    let geojson
    if (source) {
        console.log(`Loading boundaries from ${source}...`)
        const raw = await fs.readFile(source, 'utf8')
        geojson = JSON.parse(raw)
    } else {
        console.log('Fetching OSM boundaries (admin_level=8) for Damascus...')
        const osm = await fetchOverpass(query)
        geojson = osmtogeojson(osm)
    }

    const adm1Set = new Set(adm1.map((item) => item.toLowerCase()))
    const shouldFilterAdm1 = adm1Set.size > 0
    const matchesAdm1 = (feature) => {
        if (!shouldFilterAdm1) return true
        const value = pickProperty(feature, adm1Field)
        if (!value) return false
        return adm1Set.has(String(value).toLowerCase())
    }

    const features = geojson.features
        .filter((feature) => feature.geometry && (feature.geometry.type === 'Polygon' || feature.geometry.type === 'MultiPolygon'))
        .filter(matchesAdm1)
        .map((feature) => toBoundaryFeature(feature, resolution, { nameField, idField }))
        .filter(Boolean)

    const collection = {
        type: 'FeatureCollection',
        features,
    }

    await fs.writeFile(output, JSON.stringify(collection, null, 2))
    console.log(`Wrote ${features.length} district boundaries to ${output}`)
}

main().catch((err) => {
    console.error(err)
    process.exit(1)
})
