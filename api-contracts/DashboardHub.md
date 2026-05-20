# DashboardHub — SignalR

Hub URL: `{VITE_HUB_URL}` → `http://localhost:5000/hubs/dashboard`
Protocol: WebSocket (with Long-Polling fallback via ASP.NET Core SignalR)
Auth: Clerk JWT passed via `accessTokenFactory` in the `HubConnectionBuilder`. The factory is called fresh on every (re)connect — never cache the token between reconnects.

```
.withUrl(hubUrl, { accessTokenFactory: () => getAuthToken() })
```

The backend validates the JWT on the `OnConnectedAsync` override. Reject the connection if the token is missing or invalid (return a 401 response).

---

## Reconnection Strategy

The frontend uses `.withAutomaticReconnect([0, 2000, 5000, 10000, 30000])`:

- Attempt 1: immediately
- Attempt 2: 2 s
- Attempt 3: 5 s
- Attempt 4: 10 s
- Attempt 5: 30 s
- After the last attempt: `onclose` fires → frontend shows "Disconnected" badge

The backend does not need to do anything special for reconnects beyond standard SignalR behavior.

---

## Server → Client Events

The backend calls these methods on connected clients. All payloads are serialized as JSON via camelCase (default ASP.NET Core SignalR behavior).

---

### DriverPositionUpdated

Fired when a driver's position changes. Expected frequency: **1 Hz per driver** (configurable).

```json
{
  "driverId": "uuid",
  "lat": 33.5201,
  "lng": 36.2830,
  "districtId": "uuid"
}
```

**TypeScript interface:**
```ts
interface DriverPositionUpdatedPayload {
  driverId: string
  lat: number
  lng: number
  districtId: string
}
```

**Frontend handler:** Updates `liveStore.drivers[driverId].lat/lng/districtId`.

**Performance note:** With 15+ drivers at 1 Hz, the backend should consider batching all position updates for a single tick into one message:

```ts
// Batched variant (post-v1):
interface BatchedPositionUpdatePayload {
  positions: DriverPositionUpdatedPayload[]
}
```

Single-message batch is handled on the frontend by iterating `positions` and calling `updateDriverPosition` for each. The single-driver variant is used in v1.

---

### DeliveryUpdated

Fired when a delivery's status, assigned driver, or ETA changes.

```json
{
  "deliveryId": "uuid",
  "status": "Delivered",
  "assignedDriverId": "uuid",
  "etaSeconds": 0
}
```

**TypeScript interface:**
```ts
interface DeliveryUpdatedPayload {
  deliveryId: string
  status: 'Created' | 'Assigned' | 'InTransit' | 'Delivered' | 'Anomalous'
  assignedDriverId?: string | null
  etaSeconds?: number | null
}
```

**Frontend handler:** Patches `liveStore.deliveries[deliveryId]` with the changed fields. Also updates `focusStore.etaSeconds` if the delivery is currently focused.

**Notes:**
- `assignedDriverId` and `etaSeconds` are optional — only include fields that changed.
- If `status = 'Delivered'`, the frontend's ETA countdown stops.

---

### AnomalyBroadcast

Fired when the anomaly detection system flags a delivery or driver.

```json
{
  "deliveryId": "uuid",
  "driverId": "uuid",
  "driverName": "Ahmed Al-Sayed",
  "anomalyType": "Stall",
  "reason": "Stalled for 3 min",
  "districtId": "uuid",
  "lat": 33.5138,
  "lng": 36.2765,
  "timestamp": "2026-05-20T09:12:00Z"
}
```

**TypeScript interface:**
```ts
interface AnomalyBroadcastPayload {
  deliveryId: string
  driverId: string
  driverName: string
  anomalyType: 'Stall' | 'RouteDeviation' | 'Delay'
  reason: string
  districtId: string
  lat: number
  lng: number
  timestamp: string  // ISO 8601
}
```

**Frontend handler:**
1. Calls `liveStore.pushAnomaly({ id: 'anom-{timestamp}-{driverId}', ...payload })`.
2. `useAnomalyToasts` observes the queue and shows a toast with a "View" action that flies the map to `[lat, lng]`.
3. The alert is also persisted via the REST endpoint `GET /api/alerts`.

**Notes:**
- `timestamp` must be an ISO 8601 string (UTC). The frontend uses it as part of the generated `id`.
- Broadcast to all connected clients in the same hub group (or all clients for the demo).

---

### ForecastOverlayUpdated

Fired when the forecast model produces a new estimate for a district. Used to update the Recommendation Overlay in real time without polling.

```json
{
  "districtId": "uuid",
  "forecastedDemand": 22,
  "updatedAt": "2026-05-20T10:00:00Z"
}
```

**TypeScript interface:**
```ts
interface ForecastOverlayUpdatedPayload {
  districtId: string
  forecastedDemand: number
  updatedAt: string
}
```

**Frontend handler (Phase 10+):** Currently a no-op stub on the frontend. Will be wired to invalidate the React Query `['forecast', districtId]` cache when the recommendation overlay is fully integrated with the real forecast API.

**Notes:**
- Fire this when the forecast model re-runs (e.g., once per hour or on significant demand change).
- Not required for the graduation demo — the overlay uses stub ratios in demo mode.

---

## Client → Server Methods

The frontend does not currently send any messages to the hub. The dashboard is a read-only consumer of real-time data.

---

## Backend Implementation Notes

### Hub class skeleton (ASP.NET Core)

```csharp
[Authorize]
public class DashboardHub : Hub
{
    public override async Task OnConnectedAsync()
    {
        // Optionally: add client to a district-specific group
        await base.OnConnectedAsync();
    }
}
```

### Broadcasting positions

Call `Clients.All.SendAsync("DriverPositionUpdated", payload)` from a background service (`IHostedService`) that ticks at the configured interval (default 1 Hz per driver).

### Anomaly detection

When the anomaly detection logic triggers (stall detection, route deviation), call:
```csharp
await _hubContext.Clients.All.SendAsync("AnomalyBroadcast", payload);
```

And also persist the alert to the `anomaly_alerts` table so it appears in `GET /api/alerts`.

---

## Connection Status States (frontend)

| State | When | UI |
|-------|------|----|
| `connected` | Hub connection established | Green dot, "Live" |
| `reconnecting` | `onreconnecting` callback | Amber dot, "Reconnecting..." |
| `disconnected` | `onclose` callback | Red dot, "Disconnected" |
