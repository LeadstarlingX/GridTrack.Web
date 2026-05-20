# AnalyticsController

Base path: `/api/analytics`
Auth: Bearer JWT (Clerk) required.
Roles: `admin`, `stakeholder` — read access.

---

## GET /api/analytics/summary

Returns a snapshot of key operational metrics. Displayed in the Analytics Overview metric cards.

### Query Parameters

None.

### Response — 200 OK

```json
{
  "totalDeliveriesToday": 142,
  "completionRate": 0.87,
  "activeDrivers": 9,
  "anomalyRate": 0.04,
  "updatedAt": "2026-05-20T09:00:00Z"
}
```

**TypeScript DTO**: `AnalyticsSummaryDto`

| Field | Type | Description |
|-------|------|-------------|
| `totalDeliveriesToday` | `number` | Count of deliveries created in the last 24 hours |
| `completionRate` | `number` | `0–1`. Ratio of `Delivered` / total deliveries today |
| `activeDrivers` | `number` | Count of drivers with status `in-transit` |
| `anomalyRate` | `number` | `0–1`. Anomalous deliveries / total, last 7 days |
| `updatedAt` | `string` | ISO 8601 timestamp of when these metrics were computed |

### Notes
- React Query `staleTime`: 60 seconds. Not a real-time feed.
- Computing `anomalyRate` across 7 days is acceptable if cached (e.g., computed every 5 minutes by a background job and stored).

### Error Codes

| HTTP | Code | When |
|------|------|------|
| 401  | `UNAUTHORIZED` | Missing or expired JWT |

---

## GET /api/analytics/trends

Returns time-bucketed delivery and anomaly counts for chart rendering.

### Query Parameters

| Parameter     | Type     | Required | Description |
|---------------|----------|----------|-------------|
| `from`        | `string` | Yes      | ISO date `YYYY-MM-DD` |
| `to`          | `string` | Yes      | ISO date `YYYY-MM-DD` |
| `granularity` | `string` | Yes      | `hour` or `day` |

### Response — 200 OK

```json
{
  "deliveryTrend": [
    { "bucket": "Mon", "value": 24 },
    { "bucket": "Tue", "value": 31 }
  ],
  "anomalyTrend": [
    { "bucket": "Mon", "value": 2 },
    { "bucket": "Tue", "value": 0 }
  ]
}
```

**TypeScript DTO**: `AnalyticsTrendDto`

| Field | Type | Description |
|-------|------|-------------|
| `bucket` | `string` | Human-readable label. For `day`: `"Mon"`, `"Tue"`. For `hour`: `"08:00"`, `"09:00"`. |
| `value` | `number` | Count for that bucket |

### Notes
- Frontend sends `granularity: 'day'` for ranges > 1 day, `'hour'` for same-day analysis.
- The `bucket` format should match: `day` → abbreviated weekday name, `hour` → `"HH:00"` 24-hour format.
- Both `deliveryTrend` and `anomalyTrend` must have matching `bucket` labels in the same order.

### Error Codes

| HTTP | Code | When |
|------|------|------|
| 400  | `VALIDATION_ERROR` | Missing required params, invalid `granularity`, or `from > to` |
| 401  | `UNAUTHORIZED` | Missing or expired JWT |

---

## GET /api/analytics/h3-density

Returns H3 cell delivery counts for the Historical Heatmap overlay. Cells are at the requested resolution.

### Query Parameters

| Parameter    | Type     | Required | Description |
|--------------|----------|----------|-------------|
| `from`       | `string` | Yes      | ISO date `YYYY-MM-DD` |
| `to`         | `string` | Yes      | ISO date `YYYY-MM-DD` |
| `resolution` | `number` | Yes      | H3 resolution. Accepted values: `7`, `8`, `9`. |
| `fromHour`   | `number` | No       | Hour-of-day filter `0–23`. Default: 0. |
| `toHour`     | `number` | No       | Hour-of-day filter `0–23`. Default: 23. |

### Response — 200 OK

```json
{
  "cells": [
    {
      "h3Index": "88193ad3c3fffff",
      "lat": 33.5138,
      "lng": 36.2765,
      "deliveryCount": 14
    }
  ]
}
```

**TypeScript DTO**: `H3DensityDto`

| Field | Type | Description |
|-------|------|-------------|
| `h3Index` | `string` | H3 cell index string at the requested resolution |
| `lat` | `number` | Cell centroid latitude |
| `lng` | `number` | Cell centroid longitude |
| `deliveryCount` | `number` | Number of deliveries in this cell within the date/hour range |

### Notes
- Query: `GROUP BY h3_index WHERE created_at BETWEEN ... AND EXTRACT(HOUR FROM created_at) BETWEEN fromHour AND toHour`
- Uses the `h3_index` column on the `deliveries` table (pre-computed at insert time via `H3.LatLngToCell(lat, lng, resolution: 8)`).
- React Query `staleTime`: 5 minutes.
- Return only cells with `deliveryCount > 0`. The frontend colors cells by percentile, so returning all cells is wasteful.
- Only resolution 8 is stored on deliveries. For resolution 7/9, convert at query time: `H3.CellToParent(h3_index, resolution)` for coarser, or omit support for 9 (accept only 7–8 in v1).

### Error Codes

| HTTP | Code | When |
|------|------|------|
| 400  | `VALIDATION_ERROR` | Missing required params, resolution out of range, or `fromHour > toHour` |
| 401  | `UNAUTHORIZED` | Missing or expired JWT |
