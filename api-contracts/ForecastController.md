# ForecastController

Base path: `/api/forecast`
Auth: Bearer JWT (Clerk) required.
Roles: `admin`, `stakeholder`.

---

## GET /api/forecast/{districtId}

Returns the current demand forecast and staffing recommendation for a district. Used by the **Recommendation Overlay** on the Live Ops map, and optionally by the District side panel.

### Path Parameters

| Parameter    | Type     | Description |
|--------------|----------|-------------|
| `districtId` | `string` | UUID of the district |

### Response — 200 OK

```json
{
  "districtId": "uuid",
  "forecastedDemand": 18,
  "horizon": "next-hour",
  "driverRecommendation": 4,
  "staffingRatio": 0.72,
  "updatedAt": "2026-05-20T09:00:00Z"
}
```

**TypeScript DTO**: `ForecastDto`

| Field | Type | Description |
|-------|------|-------------|
| `districtId` | `string` | UUID of the district |
| `forecastedDemand` | `number` | Expected delivery count for the forecast horizon |
| `horizon` | `string` | Forecast window label, e.g. `"next-hour"`, `"next-30-min"` |
| `driverRecommendation` | `number` | Suggested number of active drivers for this district |
| `staffingRatio` | `number` | `activeDrivers / forecastedDemand`. Used by the map overlay color scale. |
| `updatedAt` | `string` | ISO 8601 timestamp of the last forecast computation |

### Staffing Ratio Color Scale (frontend-rendered)

| Range | Color | Meaning |
|-------|-------|---------|
| `< 0.5` | Red `#ef4444` | Severely understaffed |
| `0.5 – 0.85` | Amber `#f59e0b` | Understaffed |
| `0.85 – 1.15` | Green `#22c55e` | Optimal |
| `> 1.15` | Indigo `#6366f1` | Overstaffed |

Thresholds are configurable in `APP_CONFIG.recommendation.*`.

### Notes
- In **stub/demo phase**, the frontend computes `staffingRatio` from `mockData`. In production, this endpoint replaces the stub.
- `activeDrivers` for the ratio is computed server-side from the live driver state (not the frontend's `liveStore`).
- `ForecastOverlayUpdated` SignalR event pushes updated forecasts in real time when the forecast model re-runs. See `DashboardHub.md`.
- The frontend calls this per-district when the recommendation overlay is toggled on.

### Error Codes

| HTTP | Code | When |
|------|------|------|
| 404  | `DISTRICT_NOT_FOUND` | No district with that ID |
| 401  | `UNAUTHORIZED` | Missing or expired JWT |

---

## Backend Implementation Notes

### Stub phase (v1)

Use a static lookup table: `expectedDemand[districtId][hourOfDay][dayOfWeek]` — pre-seeded constants representing historical averages. Acceptable for graduation demo.

### Production phase (v2+)

Replace the static table with a trained model (ML or statistical). The `staffingRatio` computation:

```
staffingRatio = activeDriverCount(districtId) / forecastedDemand(districtId, horizon)
```

Where `activeDriverCount` = count of drivers assigned to the district with status `in-transit` or `available`.
