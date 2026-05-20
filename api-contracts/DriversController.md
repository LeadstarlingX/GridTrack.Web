# DriversController

Base path: `/api/drivers`
Auth: Bearer JWT (Clerk) required on all endpoints.
Roles: `admin` — all operations. `stakeholder`, `dispatcher` — GET only. `PATCH /availability` is `admin` only (must be enforced server-side, not just on the frontend).

---

## GET /api/drivers

Returns a cursor-paginated list of drivers. Used by the Drivers table view.

### Query Parameters

| Parameter    | Type     | Required | Description |
|--------------|----------|----------|-------------|
| `cursor`     | `string` | No       | Opaque cursor from the previous response. Omit for first page. |
| `districtId` | `string` | No       | Filter by district UUID. |
| `status`     | `string` | No       | Filter by status. Allowed values: `available`, `in-transit`, `offline`. |
| `pageSize`   | `number` | No       | Items per page. Default: 8. Max: 100. |

### Response — 200 OK

```json
{
  "items": [
    {
      "id": "uuid",
      "name": "Ahmed Al-Sayed",
      "status": "in-transit",
      "districtId": "uuid",
      "districtName": "Midan",
      "lat": 33.5138,
      "lng": 36.2765
    }
  ],
  "nextCursor": "string | null"
}
```

**TypeScript DTO**: `PagedResponse<DriverListItemDto>`

### Notes
- `districtName` is denormalized — join at query time.
- `lat` / `lng` represent the driver's last known position (updated via SignalR in the live ops map, stored in the `driver_positions` table or equivalent).
- The live ops map always uses SignalR position updates, not this endpoint. This endpoint provides the initial snapshot for the Drivers table only.

### Error Codes

| HTTP | Code | When |
|------|------|------|
| 401  | `UNAUTHORIZED` | Missing or expired JWT |
| 403  | `FORBIDDEN` | Role not permitted |
| 400  | `VALIDATION_ERROR` | Invalid `status` value |

---

## PATCH /api/drivers/{id}/availability

Toggles a driver's availability status. **Admin only.**

### Path Parameters

| Parameter | Type     | Description |
|-----------|----------|-------------|
| `id`      | `string` | UUID of the driver |

### Request Body

```json
{
  "status": "available"
}
```

**TypeScript DTO**: `DriverAvailabilityRequest`

| Field    | Type     | Allowed values |
|----------|----------|----------------|
| `status` | `string` | `available`, `offline` |

Note: `in-transit` cannot be set via this endpoint. Status transitions to/from `in-transit` are managed internally by the delivery assignment system.

### Response — 200 OK

```json
{
  "id": "uuid",
  "status": "available",
  "updatedAt": "2026-05-20T09:15:00Z"
}
```

**TypeScript DTO**: `DriverAvailabilityResponse`

### Error Codes

| HTTP | Code | When |
|------|------|------|
| 403  | `FORBIDDEN` | Caller does not have `admin` role |
| 404  | `DRIVER_NOT_FOUND` | No driver with that ID |
| 400  | `VALIDATION_ERROR` | `status` is not `available` or `offline` |
| 409  | `DRIVER_IN_TRANSIT` | Driver cannot be set offline while `in-transit` |
| 401  | `UNAUTHORIZED` | Missing or expired JWT |
