In response to trends in the gaming industry, as of 1st of September 2026, GridTrack will cease
production of the CD pipeline into docker containers and shift to production of floppy disks.

Developers can still order a pigeon carrier to receive the latest updates within a stainless-steel
container right to their doorstep.


# GridTrack.Web

React operator dashboard for the GridTrack AI Agent-integrable delivery-monitoring system. Displays live driver
positions, delivery lifecycle events, anomaly alerts, district demand forecasts, and AI-assisted
analytics — all updated in real time over a persistent SignalR WebSocket connection to the .NET
backend.

## Related repositories

- [GridTrack](https://github.com/LeadstarlingX/GridTrack) — .NET 9 dispatch API (WebSocket host, REST API).
- [gridtrack-forecasting](https://github.com/LeadstarlingX/gridtrack-forecasting) — Python AI/ML pipeline (chatbot, urgency scoring, demand forecasting).
- **GridTrack.Web** (this repo) — React real-time operator dashboard.

## What it does

- **Live operations map** — MapLibre GL map centered on Damascus; driver markers update in real time from SignalR position batches; route polylines show the road-snapped ahead-path per active delivery; district boundary overlays loaded from local GeoJSON.
- **Focus mode** — click any delivery or driver to fly the map to it, lock tracking to the driver, show the route ahead, and display a live ETA countdown. Deep-linkable from the deliveries list.
- **Anomaly triage** — `AnomalyBroadcast` and `DemandSurge` events appear as toast notifications and queue in the alert-triage panel. Stalled drivers (`StallDetected`) are flagged on the map with a visual indicator.
- **Analytics** — KPI summary (total deliveries, completion rate, active drivers, anomaly rate, on-time rate), delivery trend, anomaly rate, district volume, status breakdown, demand forecast, and driver urgency-score trend charts — all filtered by a date-range picker. Drillthrough: click a district bar to jump to its deliveries. CSV export (range or full dataset).
- **Performance analytics** — driver utilization rates, cancellation breakdown by reason, anomaly type breakdown, and delivery-time performance histograms.
- **AI assistant** — streaming SSE chatbot backed by gridtrack-forecasting; voice input transcribed via Groq Whisper; conversation context (date range + fleet snapshot) is sent with every message; PDF report download from any conversation.
- **Staffing forecast** — per-district recommended driver counts from the Python service, displayed alongside the assistant.
- **Drivers** — paginated driver list with on-time rate, anomaly rate, and current status; detail drawer with 7-day performance stats and availability toggle.
- **Deliveries** — live delivery list with 15 s polling; create-delivery modal with nearest-driver lookup; timeline drawer showing the full lifecycle (assigned → picked-up → delivered, with anomaly flags and cancellations). Deep-links to focus mode on the map.
- **Auth** — Clerk JWT authentication; all routes guarded; token forwarded to both the REST API and the SignalR hub.
- **Dark / light theme** — persisted preference via next-themes.

## Architecture & development methodology

State is split across four Zustand stores:

| Store | Responsibility |
|-------|---------------|
| `liveStore` | Driver positions, delivery map, anomaly queue, surge and incident lists |
| `mapStore` | SignalR hub status, RTT, district boundary GeoJSON, side-panel mode |
| `focusStore` | Focus-mode target driver and delivery, route trail |
| `settingsStore` | User preferences (theme, toast settings) |

SignalR events consumed:

| Event | Action |
|-------|--------|
| `DriverPositionBatch` | Bulk-updates driver markers; performance-marked for DevTools |
| `DriverPositionUpdated` | Single-driver position update |
| `DeliveryUpdated` | Patches delivery status, ETA deadline, route cost |
| `AnomalyBroadcast` | Pushes anomaly to triage queue |
| `ForecastOverlayUpdated` | Invalidates TanStack Query `forecast` cache for the district |
| `StallDetected` | Marks driver as stalled on the map |
| `DemandSurge` | Toast notification + pushes surge to store |
| `AnomalyIncident` | Pushes incident cluster to store |

REST data is fetched with TanStack Query (60 s stale time, no window-focus refetch). The delivery list refetches on a 15 s interval. Analytics queries are parameterised by date range and re-run on `Apply`. Historical heatmap data has a 5-minute stale time.

All API calls target the .NET backend. The `/api/analysis/*` routes are proxied by .NET to gridtrack-forecasting; the dashboard never calls the Python service directly.

## Running locally

**Full stack (Docker) — start the API from the [GridTrack](https://github.com/LeadstarlingX/GridTrack) repo first:**
```bash
# In the GridTrack repo:
docker compose up -d
# then, in this repo:
npm run dev             # dashboard on :5173
```

**Infra-only inner loop:**
```bash
# In the GridTrack repo:
docker compose up -d gridtrack.db gridtrack.redis gridtrack.rabbitmq gridtrack.clickhouse
dotnet run --project GridTrack.Api          # .NET API on :5098
uvicorn app.main:app --reload               # gridtrack-forecasting on :8000

# In this repo:
npm install
npm run dev    # :5173
```

Copy `.env.example` to `.env.local` and set:
```
VITE_API_URL=http://localhost:5098
VITE_HUB_URL=http://localhost:5098/hubs/dispatch
VITE_CLERK_PUBLISHABLE_KEY=pk_...
```

**Type-check and lint:**
```bash
npm run typecheck
npm run lint
```

## Pages

| Route | Page |
|-------|------|
| `/` | Live Ops — real-time map, driver markers, anomaly triage |
| `/analytics` | Analytics — KPI summary, trends, district volume, demand forecast |
| `/performance` | Performance — driver stats, cancellations, anomaly breakdown |
| `/assistant` | AI Assistant — streaming chatbot, staffing forecast |
| `/deliveries` | Deliveries — live list, create modal, timeline drawer |
| `/cancelled` | Cancelled Orders |
| `/alerts` | Alerts |
| `/drivers` | Driver list and detail drawer |
| `/settings` | User settings |

## MCP server — AI agent integration

The Python pipeline ([gridtrack-forecasting](https://github.com/LeadstarlingX/gridtrack-forecasting))
exposes an **MCP server** so AI agents can query live fleet data (active drivers, anomalies,
deliveries, district status, stalled drivers, activity trends, and peak-hour data) as native tools.

- **URL:** `http://localhost:8000/mcp` (SSE transport — Python service must be running)
- **Auth:** `Authorization: Bearer <MCP_API_KEY>` — key defined in `.env` at the GridTrack repo root

Full setup instructions and available tools: [gridtrack-forecasting README](https://github.com/LeadstarlingX/gridtrack-forecasting#mcp-server--ai-agent-integration).

## License

This project is licensed under the [MIT License](LICENSE).
