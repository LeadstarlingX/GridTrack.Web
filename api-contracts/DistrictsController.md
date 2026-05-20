# DistrictsController

Base path: `/api/districts`
Auth: Bearer JWT (Clerk) required on all endpoints.
Roles: All authenticated roles may read.

---

## GET /api/districts

Returns all districts with their metadata. Used for building district name lookup maps throughout the frontend (dropdowns, tables, side panels).

### Query Parameters

None.

### Response — 200 OK

```json
[
  {
    "id": "uuid",
    "name": "Midan",
    "centroid": {
      "lat": 33.5010,
      "lng": 36.2862
    }
  }
]
```

**TypeScript DTO**: `DistrictDto[]`

### Notes
- This endpoint is called **once per session** with `staleTime: Infinity` in React Query. The response is cached for the entire session.
- No pagination — the district list is small and fixed.
- `centroid` is used by the side panel when flying the map to a selected district.

### Error Codes

| HTTP | Code | When |
|------|------|------|
| 401  | `UNAUTHORIZED` | Missing or expired JWT |

---

## GET /api/districts/boundaries

Returns district boundaries as a GeoJSON FeatureCollection. Rendered by `DistrictBoundaryLayer` on the Live Ops map.

### Query Parameters

None.

### Response — 200 OK

Raw GeoJSON `FeatureCollection`. Each feature is a `MultiPolygon` with properties:

```json
{
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "geometry": {
        "type": "MultiPolygon",
        "coordinates": [ ... ]
      },
      "properties": {
        "districtId": "uuid",
        "name": "Midan"
      }
    }
  ]
}
```

**TypeScript DTO**: `GeoJSON.FeatureCollection` (features have `DistrictBoundaryProperties`)

### Notes
- Cached with `staleTime: Infinity` — district boundaries never change in production without an admin action (Phase B / post-graduation).
- Backend generates this by calling `H3.net CellsToMultiPolygon(district.h3_indices)` per district. The H3 indices are stored in the `districts` table.
- GeoJSON coordinate order must be **[lng, lat]** (GeoJSON spec). The frontend normalizes any reversed axes, but prefer to return [lng, lat] from the backend.
- Cache aggressively at the HTTP layer as well (e.g. `Cache-Control: max-age=86400`).

### Error Codes

| HTTP | Code | When |
|------|------|------|
| 401  | `UNAUTHORIZED` | Missing or expired JWT |

---

## Backend Implementation Notes

### Districts table schema

```sql
districts
  id          UUID PRIMARY KEY
  name        TEXT NOT NULL
  h3_indices  TEXT[] NOT NULL   -- H3 cell index strings at resolution 8
  created_at  TIMESTAMPTZ
```

### Seeding

District boundaries are seeded once using H3.net `PolygonToCells()` against OSM Overpass data for Damascus administrative boundaries (admin_level 8).

Query: `[out:json]; relation["boundary"="administrative"]["admin_level"="8"](area["name"="Damascus"]); out geom;`

Seed class runs as an EF Core seeder or `IHostedService` on first startup. After seeding, districts are static.

### In-memory district lookup

At startup, load `Dictionary<string, string>` mapping `h3Index → districtId` from the database. Driver district assignment = dictionary lookup (no DB query per position update).
