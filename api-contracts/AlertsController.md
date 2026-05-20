# AlertsController

Base path: `/api/alerts`
Auth: Bearer JWT (Clerk) required.
Roles: `admin`, `stakeholder`, `dispatcher` — read access.

---

## GET /api/alerts

Returns a cursor-paginated list of anomaly alerts. Used by the Alerts table view. Alerts are also pushed in real time via SignalR (`AnomalyBroadcast`); this endpoint provides the historical record.

### Query Parameters

| Parameter     | Type     | Required | Description |
|---------------|----------|----------|-------------|
| `cursor`      | `string` | No       | Opaque cursor from the previous response. |
| `from`        | `string` | No       | ISO date `YYYY-MM-DD`. Filter `timestamp >= from`. |
| `to`          | `string` | No       | ISO date `YYYY-MM-DD`. Filter `timestamp <= to` (end of day). |
| `districtId`  | `string` | No       | Filter by district UUID. |
| `anomalyType` | `string` | No       | Filter by type. Allowed values: `Stall`, `RouteDeviation`, `Delay`. |
| `pageSize`    | `number` | No       | Items per page. Default: 6. Max: 100. |

### Response — 200 OK

```json
{
  "items": [
    {
      "id": "uuid",
      "deliveryId": "uuid",
      "driverId": "uuid",
      "driverName": "Ahmed Al-Sayed",
      "anomalyType": "Stall",
      "reason": "Stalled for 3 min",
      "districtId": "uuid",
      "districtName": "Midan",
      "lat": 33.5138,
      "lng": 36.2765,
      "timestamp": "2026-05-20T09:00:00Z"
    }
  ],
  "nextCursor": "string | null"
}
```

**TypeScript DTO**: `PagedResponse<AnomalyAlertDto>`

### Notes
- `driverName` and `districtName` are denormalized — join at query time.
- Alerts are ordered by `timestamp DESC` by default.
- The same alert is broadcast via `AnomalyBroadcast` on the SignalR hub. The frontend stores it in the in-memory `anomalyQueue`. This REST endpoint backs the paginated historical table.

### Error Codes

| HTTP | Code | When |
|------|------|------|
| 401  | `UNAUTHORIZED` | Missing or expired JWT |
| 403  | `FORBIDDEN` | Role not permitted |
| 400  | `VALIDATION_ERROR` | Invalid `anomalyType` |

---

## Backend Implementation Notes

### Anomaly types

| Value | Meaning |
|-------|---------|
| `Stall` | Driver stopped for an unusually long time |
| `RouteDeviation` | Driver deviated significantly from the planned route |
| `Delay` | Estimated arrival time exceeded the expected threshold |

### Alert table schema

```sql
anomaly_alerts
  id            UUID PRIMARY KEY
  delivery_id   UUID REFERENCES deliveries(id)
  driver_id     UUID REFERENCES drivers(id)
  anomaly_type  TEXT NOT NULL   -- 'Stall' | 'RouteDeviation' | 'Delay'
  reason        TEXT
  district_id   UUID REFERENCES districts(id)
  lat           DOUBLE PRECISION
  lng           DOUBLE PRECISION
  timestamp     TIMESTAMPTZ NOT NULL
```
