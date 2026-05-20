# DeliveriesController

Base path: `/api/deliveries`
Auth: Bearer JWT (Clerk) required on all endpoints.
Roles: `admin`, `stakeholder`, `dispatcher` may read. No mutation endpoints on deliveries (status is driven by SignalR / backend logic only).

---

## GET /api/deliveries

Returns a cursor-paginated list of deliveries. Used by the Deliveries table view.

### Query Parameters

| Parameter   | Type     | Required | Description |
|-------------|----------|----------|-------------|
| `cursor`    | `string` | No       | Opaque cursor from a previous response's `nextCursor`. Omit for the first page. |
| `status`    | `string` | No       | Filter by status. Allowed values: `Created`, `Assigned`, `InTransit`, `Delivered`, `Anomalous`. |
| `districtId`| `string` | No       | Filter by district UUID. |
| `from`      | `string` | No       | ISO date `YYYY-MM-DD`. Filter `createdAt >= from`. |
| `to`        | `string` | No       | ISO date `YYYY-MM-DD`. Filter `createdAt <= to` (end of day). |
| `pageSize`  | `number` | No       | Items per page. Default: 6. Max: 100. |

### Response — 200 OK

```json
{
  "items": [
    {
      "id": "uuid",
      "status": "InTransit",
      "districtId": "uuid",
      "assignedDriverId": "uuid | null",
      "assignedDriverName": "string | null",
      "etaSeconds": 240,
      "createdAt": "2026-05-20T08:00:00Z"
    }
  ],
  "nextCursor": "string | null",
  "totalCount": 142
}
```

**TypeScript DTO**: `PagedResponse<DeliveryListItemDto>`

### Notes
- `assignedDriverName` is denormalized — join on the `drivers` table at query time so the frontend avoids N+1 lookups.
- `totalCount` is optional and expensive; omit it unless the client explicitly requests it.
- `nextCursor` is `null` when there are no more pages.

### Error Codes

| HTTP | Code | When |
|------|------|------|
| 401  | `UNAUTHORIZED` | Missing or expired JWT |
| 403  | `FORBIDDEN` | Role not permitted |
| 400  | `VALIDATION_ERROR` | Invalid `status` value or malformed dates |

---

## GET /api/deliveries/{id}

Returns full detail for a single delivery, including the route polyline for map rendering and focus mode.

### Path Parameters

| Parameter | Type     | Description |
|-----------|----------|-------------|
| `id`      | `string` | UUID of the delivery |

### Response — 200 OK

```json
{
  "id": "uuid",
  "status": "InTransit",
  "districtId": "uuid",
  "assignedDriverId": "uuid",
  "assignedDriverName": "Ahmed Al-Sayed",
  "etaSeconds": 180,
  "createdAt": "2026-05-20T08:00:00Z",
  "updatedAt": "2026-05-20T09:12:00Z",
  "routePolyline": [
    [33.5138, 36.2765],
    [33.5201, 36.2830]
  ]
}
```

**TypeScript DTO**: `DeliveryDetailDto`

### Notes
- `routePolyline` is an array of `[lat, lng]` pairs representing the planned route.
- Used when the user clicks a delivery row to enter **Focus Mode** on the Live Ops map.

### Error Codes

| HTTP | Code | When |
|------|------|------|
| 404  | `DELIVERY_NOT_FOUND` | No delivery with that ID |
| 401  | `UNAUTHORIZED` | Missing or expired JWT |
