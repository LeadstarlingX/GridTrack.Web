# GridTrack API Contracts

Generated from the frontend implementation. Each file documents one backend controller or hub.
Use these as the source of truth when implementing controllers, request/response DTOs, and the SignalR hub.

## Files

| File | Path prefix | Description |
|------|-------------|-------------|
| [DeliveriesController.md](./DeliveriesController.md) | `/api/deliveries` | Delivery list (paginated) + detail |
| [DriversController.md](./DriversController.md) | `/api/drivers` | Driver list (paginated) + availability toggle |
| [DistrictsController.md](./DistrictsController.md) | `/api/districts` | District metadata + GeoJSON boundaries |
| [AlertsController.md](./AlertsController.md) | `/api/alerts` | Anomaly alert history (paginated) |
| [AnalyticsController.md](./AnalyticsController.md) | `/api/analytics` | Summary metrics, trends, H3 density heatmap |
| [ExportController.md](./ExportController.md) | `/api/export` | CSV export (filtered or full) |
| [AnalysisController.md](./AnalysisController.md) | `/api/analysis` | AI chatbot endpoint |
| [ForecastController.md](./ForecastController.md) | `/api/forecast` | District staffing forecast + recommendation |
| [DashboardHub.md](./DashboardHub.md) | SignalR hub | Real-time driver positions, delivery updates, anomaly alerts |

## Global Conventions

- All endpoints are prefixed `/api`.
- All IDs are strings (UUID v4 on the backend).
- All dates are ISO 8601 strings (UTC).
- Query parameters use `camelCase`.
- All non-2xx responses return `ApiError`:
  ```json
  { "code": "DELIVERY_NOT_FOUND", "message": "Human-readable text.", "traceId": "optional" }
  ```
- All list endpoints use **cursor pagination**:
  ```json
  { "items": [...], "nextCursor": "opaque-string | null" }
  ```
  Cursors are opaque — the frontend never constructs them.
- Auth: Bearer JWT from Clerk on every request.
  Header: `Authorization: Bearer <token>`

## HTTP Status Codes

| Code | Meaning |
|------|---------|
| 200 | Success |
| 201 | Created |
| 400 | Validation error |
| 401 | Missing or expired JWT |
| 403 | Insufficient role |
| 404 | Resource not found |
| 409 | Conflict (e.g. driver in-transit cannot be set offline) |
| 429 | Rate limited |
| 503 | Upstream LLM unavailable |
| 500 | Internal server error |
