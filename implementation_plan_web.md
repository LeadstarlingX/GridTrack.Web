# GridTrack.Web — Implementation Plan

**Generated:** May 2026  
**Scope:** React + Vite frontend for GridTrack graduation project.  
**Approach:** Stub/mock data phase → wire real backend.  
**Demo target:** 3-minute recorded video, ~30 stakeholders.

---

## Tech Stack (Locked)

| Concern | Choice |
|---|---|
| Bundler | Vite + React + TypeScript |
| Routing | React Router v6 |
| Server state | TanStack React Query v5 |
| Client/UI state | Zustand |
| Component library | shadcn/ui (Radix + Tailwind) |
| Charts | shadcn/ui chart (Recharts peer dep) |
| Map | React-Leaflet v4 + Leaflet (`preferCanvas={true}`) |
| Heatmap | `leaflet.heat` wrapper (fallback: H3 cell color scale) |
| Real-time | `@microsoft/signalr` |
| Geo utils | `@turf/turf` |
| Auth | Clerk (`@clerk/clerk-react`) |
| HTTP | axios |
| Toasts | `sonner` (ships with shadcn/ui CLI) |

---

## Directory Structure

```
GridTrack.Web/
├── public/
│   └── h3-damascus.geojson       # Pre-generated H3 grid for Damascus (resolution 8)
├── src/
│   ├── app/
│   │   ├── main.tsx
│   │   ├── App.tsx
│   │   ├── router.tsx
│   │   └── providers.tsx          # QueryClient + ClerkProvider + <Toaster /> root
│   │
│   ├── components/
│   │   ├── ui/                    # shadcn/ui generated — never edit manually
│   │   ├── layout/
│   │   │   ├── AppShell.tsx       # Sidebar + <Outlet>
│   │   │   ├── Sidebar.tsx        # Badge count on Alerts nav link
│   │   │   └── TopBar.tsx
│   │   ├── map/
│   │   │   ├── LiveMap.tsx        # <MapContainer preferCanvas={true}> root
│   │   │   ├── DriverMarker.tsx   # L.divIcon, opacity + scale aware, .dimmed class
│   │   │   ├── HexGridLayer.tsx   # <GeoJSON> layer, click → district select
│   │   │   ├── HeatmapLayer.tsx   # leaflet.heat createElementHook wrapper
│   │   │   ├── RoutePolyline.tsx  # Focus mode route line
│   │   │   ├── MapControls.tsx    # Toggle: hex grid, heatmap
│   │   │   └── ConnectionStatus.tsx  # Pulsing "Live" dot / "Reconnecting" badge
│   │   ├── side-panel/
│   │   │   ├── SidePanel.tsx      # Mode switcher: idle / district / driver / focus
│   │   │   ├── DistrictPanel.tsx  # Aggregate stats for selected H3 cell
│   │   │   ├── DriverPanel.tsx    # Driver detail on marker click
│   │   │   └── FocusModePanel.tsx # Order ID, driver name, ETA countdown, lock toggle
│   │   ├── charts/
│   │   │   ├── DeliveryTrendChart.tsx
│   │   │   ├── AnomalyRateChart.tsx
│   │   │   └── DistrictVolumeChart.tsx
│   │   └── shared/
│   │       ├── ErrorBoundary.tsx  # Global fatal SignalR disconnect boundary
│   │       ├── LiveBadge.tsx
│   │       └── CursorTable.tsx    # Reusable cursor-paginated table
│   │
│   ├── features/
│   │   ├── live-ops/
│   │   │   ├── LiveOpsPage.tsx
│   │   │   └── useFocusMode.ts
│   │   ├── analytics/
│   │   │   ├── AnalyticsPage.tsx  # Tabs: Overview | Chatbot Analysis
│   │   │   ├── useAnalyticsQueries.ts
│   │   │   └── chatbot/
│   │   │       ├── ChatbotPanel.tsx      # Tab content: date picker + chat UI
│   │   │       ├── useChatbot.ts         # Conversation history state + API calls
│   │   │       └── ChatMessage.tsx       # Single message bubble (user / assistant)
│   │   ├── deliveries/
│   │   │   ├── DeliveriesPage.tsx
│   │   │   └── useDeliveriesQuery.ts
│   │   ├── alerts/
│   │   │   ├── AlertsPage.tsx
│   │   │   └── useAlertsQuery.ts
│   │   └── drivers/
│   │       ├── DriversPage.tsx    # Admin only
│   │       └── useDriversQuery.ts
│   │
│   ├── lib/
│   │   ├── signalr/
│   │   │   ├── hubConnection.ts   # Singleton HubConnectionBuilder factory
│   │   │   ├── useSignalR.ts      # Connect / reconnect / dispose lifecycle
│   │   │   └── mockEmitter.ts     # DEV only — stepped route walk + anomaly injection
│   │   ├── api/
│   │   │   ├── client.ts          # axios + Clerk token interceptor
│   │   │   ├── deliveries.ts
│   │   │   ├── drivers.ts
│   │   │   ├── alerts.ts
│   │   │   ├── analytics.ts
│   │   │   ├── chatbot.ts         # POST /api/analysis/chat
│   │   │   └── h3.ts
│   │   └── utils/
│   │       ├── geo.ts             # Turf.js wrappers
│   │       ├── eta.ts             # ETA seconds → display string
│   │       └── format.ts
│   │
│   ├── store/
│   │   ├── liveStore.ts           # SignalR feed: Record<string, T> for O(1) patches
│   │   ├── mapStore.ts            # Layer toggles, selected district/driver
│   │   └── focusStore.ts          # Focus mode state machine
│   │
│   ├── hooks/
│   │   ├── useEtaCountdown.ts     # Local tick from stored etaSeconds
│   │   └── useDebounce.ts
│   │
│   ├── types/
│   │   ├── delivery.ts
│   │   ├── driver.ts
│   │   ├── district.ts
│   │   ├── hub.ts                 # SignalR payload shapes
│   │   └── chatbot.ts             # ChatMessage shape
│   │
│   └── constants/
│       ├── mockData.ts            # Stub phase data (removed after real wire-up)
│       └── mockRoutes.ts          # 4 Damascus road-snapped route arrays for mock walk
│
├── index.html
├── vite.config.ts
├── tailwind.config.ts
└── tsconfig.json
```

---

## Views

| Route | View | Roles |
|---|---|---|
| `/` | Live Operations — map, side panel, focus mode | admin, stakeholder |
| `/analytics` | Analytics — KPI cards + charts + chatbot tab | admin, stakeholder |
| `/deliveries` | Deliveries table — cursor paginated | admin, stakeholder |
| `/alerts` | Anomaly alerts — cursor paginated | admin, stakeholder |
| `/drivers` | Driver management | admin only |

---

## Zustand Stores

### `liveStore`
SignalR is the only writer. React Query never touches this store.

```ts
interface LiveStore {
  drivers: Record<string, DriverState>
  deliveries: Record<string, DeliveryState>
  anomalyQueue: AnomalyAlert[]          // bounded: last 50

  updateDriverPosition: (id: string, lat: number, lng: number, districtId: string) => void
  patchDelivery: (id: string, partial: Partial<DeliveryState>) => void
  pushAnomaly: (alert: AnomalyAlert) => void  // also fires sonner toast
}
```

Use plain `Record<string, T>` — spread on mutation: `{ ...state.drivers, [id]: updated }`.
Simpler to debug in Zustand devtools, identical performance at this scale.

### `mapStore`
Pure UI state. No async.

```ts
interface MapStore {
  hexGridEnabled: boolean
  heatmapEnabled: boolean
  selectedDistrictId: string | null
  selectedDriverId: string | null
  sidePanelMode: 'idle' | 'district' | 'driver' | 'focus'
  hexGeoJSON: GeoJSON.FeatureCollection | null  // loaded once on app init

  toggleHexGrid: () => void
  toggleHeatmap: () => void
  selectDistrict: (id: string | null) => void
  selectDriver: (id: string | null) => void
  setSidePanelMode: (mode: MapStore['sidePanelMode']) => void
  setHexGeoJSON: (data: GeoJSON.FeatureCollection) => void
}
```

### `focusStore`

```ts
interface FocusStore {
  focusedDeliveryId: string | null
  focusedDriverId: string | null
  autoFollow: boolean
  routePolyline: [number, number][] | null  // [lat, lng] pairs
  etaSeconds: number | null

  enterFocusMode: (
    deliveryId: string,
    driverId: string,
    polyline: [number, number][],
    etaSeconds: number
  ) => void
  exitFocusMode: () => void
  toggleAutoFollow: () => void
  setEta: (seconds: number) => void
}
```

---

## Focus Mode — Full Behavior

### Entry
1. User clicks delivery row (DeliveriesPage) or a delivery marker on map.
2. Fetch `GET /api/deliveries/{id}` → get `routePolyline`, `etaSeconds`, `assignedDriverId`.
3. Call `focusStore.enterFocusMode(...)`.
4. `mapStore.setSidePanelMode('focus')`.
5. `map.flyTo(driver.currentPosition, { zoom: 15, duration: 1.2 })`.

### Active
- SignalR `DriverPositionUpdated` for `focusedDriverId`:
  - `liveStore.updateDriverPosition(...)` (always, all drivers still update).
  - If `autoFollow === true`: `map.panTo(newPos)` (not flyTo — less aggressive).
- SignalR `DeliveryUpdated` for `focusedDeliveryId`:
  - `focusStore.setEta(etaSeconds)`.
- Leaflet `movestart` event fires with `originalEvent` (user manual pan):
  - `focusStore` sets `autoFollow = false`.
- User clicks "Lock Camera" button in FocusModePanel:
  - `focusStore.toggleAutoFollow()` → `autoFollow = true`.
  - `map.panTo(currentDriverPos)` immediately.

### Marker Visual State (active during focus)
- Focused driver: `scale(1.5)`, amber color, `z-index: 1000`, `opacity: 1`.
- All other drivers: `opacity: 0.2`, `transition: opacity 300ms ease`.
- Implemented via CSS class on `L.divIcon` container: add/remove `.dimmed` class based on `focusedDriverId`.

### Exit
1. User clicks same delivery again, clicks X in FocusModePanel, or presses Escape.
2. `focusStore.exitFocusMode()`.
3. `mapStore.setSidePanelMode('idle')`.
4. All driver markers restore to `opacity: 1`.
5. `RoutePolyline` unmounts.
6. Map does NOT reset zoom.

---

## Toast Notifications (Anomaly Alerts)

Library: `sonner` (add `<Toaster position="top-right" />` to `providers.tsx`).

When `liveStore.pushAnomaly(alert)` is called (from SignalR or mock emitter), it fires:

```ts
toast.error(`Anomaly: ${alert.driverName} stalled in District ${alert.districtId}`, {
  duration: 8000,
  action: {
    label: 'View',
    onClick: () => {
      mapRef.current?.flyTo([alert.lat, alert.lng], 15)
      mapStore.selectDriver(alert.driverId)
      mapStore.setSidePanelMode('driver')
    }
  }
})
```

Clicking the toast snaps the map to the anomalous driver and opens the driver side panel.
`mapRef` is a ref passed down from `LiveOpsPage` to allow imperative Leaflet calls outside the map component tree.

---

## Mock SignalR Emitter (Stub Phase)

File: `lib/signalr/mockEmitter.ts`  
Guard: `if (!import.meta.env.DEV) return`

### Damascus Road Routes (`constants/mockRoutes.ts`)
Four hardcoded arrays of 20–30 `[lat, lng]` points following actual Damascus roads:
- Route A: Mezzeh → Umayyad Square (west–east corridor)
- Route B: Kafr Sousa → Al-Midan (south loop)
- Route C: Bab Touma → Abbasiyyin (northeast arc)
- Route D: Malki → Arnous Square (central diagonal)

Each driver is assigned one route at initialization. The emitter steps through indices on each tick, wrapping back to index 0 on completion.

### Emitter Behavior
```ts
// Every 1000ms:
// - Step each active driver to next point on its assigned route
// - Call liveStore.updateDriverPosition(...)

// Every 10s:
// - Randomly patch one delivery status

// Every 15s:
// - Push a mock anomaly → fires toast automatically via liveStore.pushAnomaly
```

`useSignalR.ts` checks `import.meta.env.VITE_USE_MOCK_SIGNALR === 'true'` and starts the mock emitter instead of opening a real WebSocket.

---

## Chatbot Analysis Feature

### Overview
A tab inside `AnalyticsPage` labeled "AI Analysis". The user selects a date range (reusing the existing range picker), and the panel fetches the same CSV the export endpoint produces, then enables a back-and-forth conversation with an LLM about that data.

### Frontend

**`useChatbot.ts`** — manages conversation state:
```ts
interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

interface ChatbotState {
  messages: ChatMessage[]
  csvData: string | null       // fetched once per date range selection
  isLoading: boolean
  sendMessage: (text: string) => Promise<void>
  loadCsvForRange: (from: string, to: string) => Promise<void>
  clearConversation: () => void
}
```

Flow:
1. User selects date range → `loadCsvForRange` calls `GET /api/export/csv?from=&to=` → stores raw CSV string in state.
2. User types a question → `sendMessage` calls `POST /api/analysis/chat` with `{ messages: ChatMessage[], csvData: string }`.
3. Response appended to `messages[]`. Full history sent on every subsequent message (back-and-forth context).
4. "Clear conversation" button resets `messages[]` but keeps `csvData` loaded.

**`ChatbotPanel.tsx`** layout:
- Top: date range picker + "Load Data" button. Shows a badge when CSV is loaded ("7 days loaded").
- Middle: scrollable message list (`ChatMessage` bubbles, user right-aligned, assistant left).
- Bottom: text input + send button. Disabled until CSV is loaded.
- Skeleton loader while assistant is responding.

### Backend (new endpoint — GridTrack.Api)

`POST /api/analysis/chat`

Request body:
```json
{
  "messages": [
    { "role": "user", "content": "What are the peak anomaly hours?" }
  ],
  "csvData": "deliveryId,status,district,...\n..."
}
```

The handler:
1. On the first message (history length = 1), prepends a system prompt:
   > "You are a senior analyst in an R&D department reviewing delivery operations data for Damascus. You have been given a CSV export. Evaluate it and provide operational recommendations. Be concise and direct."
2. Injects `csvData` as context in the first user message (appended before the question text). Subsequent messages send history as-is — CSV already in context.
3. Calls primary LLM (Groq). On rate-limit or error, falls to fallback (Google AI Studio).
4. Returns `{ reply: string }`.

**Configuration (`appsettings.json`):**
```json
"LlmProvider": {
  "Primary": "Groq",
  "GroqApiKey": "",
  "GroqModel": "llama-3.3-70b-versatile",
  "Fallback": "GoogleAI",
  "GoogleApiKey": "",
  "GoogleModel": "gemini-2.0-flash"
}
```

Both providers use plain `HttpClient` against their REST APIs — no vendor SDK needed.

---

## SignalR Hub Events (frontend subscribes)

```ts
interface DriverPositionUpdatedPayload {
  driverId: string
  lat: number
  lng: number
  districtId: string
}

interface DeliveryUpdatedPayload {
  deliveryId: string
  status: DeliveryStatus
  assignedDriverId?: string
  etaSeconds?: number
}

interface AnomalyBroadcastPayload {
  deliveryId: string
  driverId: string
  driverName: string
  anomalyType: AnomalyType
  reason: string
  districtId: string
  lat: number
  lng: number
  timestamp: string
}

interface ForecastOverlayUpdatedPayload {
  districtId: string
  forecastedDemand: number
  updatedAt: string
}
```

Event names (must match server hub method names exactly):
- `DriverPositionUpdated`
- `DeliveryUpdated`
- `AnomalyBroadcast`
- `ForecastOverlayUpdated`

Hub URL: `{VITE_HUB_URL}` → `http://localhost:5000/hubs/dashboard`

---

## REST Endpoints (frontend consumes)

```
GET  /api/h3/bounds
     → GeoJSON FeatureCollection (H3 cells for configured resolution)
     → Aggressive cache: immutable, cache until app restart

GET  /api/deliveries
     → ?cursor=&status=&districtId=&from=&to=&pageSize=50
     → { items: DeliveryDto[], nextCursor: string | null }

GET  /api/deliveries/{id}
     → DeliveryDetailDto (includes routePolyline as [[lat,lng],...], etaSeconds)
     → Called only on focus mode entry

GET  /api/drivers
     → ?cursor=&districtId=&pageSize=50
     → { items: DriverDto[], nextCursor: string | null }

GET  /api/alerts
     → ?cursor=&from=&to=&pageSize=50
     → { items: AnomalyAlertDto[], nextCursor: string | null }

GET  /api/analytics/summary
     → { totalDeliveriesToday, completionRate, activeDrivers, anomalyRate, ... }
     → React Query staleTime: 60s

GET  /api/analytics/trends
     → ?from=&to=&granularity=hour|day
     → { deliveryTrend: TimePoint[], anomalyTrend: TimePoint[], ... }

GET  /api/forecast/{districtId}
     → { forecastedDemand: number, horizon: string, updatedAt: string }

GET  /api/export/csv
     → ?from=&to=  (max 7-day window)
     → text/csv streamed response
     → Used by chatbot panel to load analysis data

POST /api/analysis/chat
     → { messages: ChatMessage[], csvData: string }
     → { reply: string }
```

DTO shapes deferred — defined alongside API controller development.

---

## Auth Model

Clerk roles via `user.publicMetadata.role`: `"admin"` | `"stakeholder"`.

```tsx
// providers.tsx
<ClerkProvider publishableKey={import.meta.env.VITE_CLERK_PUBLISHABLE_KEY}>
  ...
</ClerkProvider>

// client.ts — axios interceptor
instance.interceptors.request.use(async (config) => {
  const token = await getToken()
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// ProtectedRoute.tsx
const { user } = useUser()
if (requiredRole && user?.publicMetadata.role !== requiredRole) {
  return <Navigate to="/" replace />
}
```

Routes requiring admin: `/drivers`.

---

## Stub Phase

### `constants/mockData.ts`
```ts
// 15 drivers with Damascus coordinates (lat ~33.51, lng ~36.29 ± variance)
// 10 deliveries in mixed statuses (Created, Assigned, InTransit, Delivered, Anomalous)
// 4 districts with H3 index strings, center coords, mock stats
// Analytics summary object
// Trend arrays (24 hourly data points)
```

### `constants/mockRoutes.ts`
```ts
// 4 route arrays, each 20-30 [lat, lng] points
// Road-approximate coordinates along Damascus major roads
// Drivers assigned routes by index: driverIndex % 4
export const DAMASCUS_ROUTES: [number, number][][] = [
  [ /* Route A: Mezzeh → Umayyad */ ],
  [ /* Route B: Kafr Sousa → Al-Midan */ ],
  [ /* Route C: Bab Touma → Abbasiyyin */ ],
  [ /* Route D: Malki → Arnous */ ],
]
```

### H3 GeoJSON
Pre-generate `public/h3-damascus.geojson` using a one-off Node script with `h3-js`:
- Resolution 8
- Bounding box: Damascus metro area
- Output: GeoJSON FeatureCollection, each Feature has `properties.h3Index`

Load on app init, store in `mapStore.hexGeoJSON`. Skips the REST call during stub phase.

---

## Connection Status Component

```
Connected    → small green pulsing dot + "Live" text
Reconnecting → amber badge "Reconnecting..." (no full-screen block)
Disconnected → red badge + global ErrorBoundary triggers if >30s
```

`ConnectionStatus.tsx` subscribes to `HubConnection.state` via `onreconnecting` / `onreconnected` / `onclose` callbacks stored in Zustand or local state.

---

## Side Panel Interaction Priority

| User action | Side panel mode |
|---|---|
| Clicks H3 hex cell | `'district'` → DistrictPanel |
| Clicks driver marker | `'driver'` → DriverPanel (overrides district) |
| Enters focus mode | `'focus'` → FocusModePanel (overrides both) |
| Clicks focused delivery again / Escape | `'idle'` |
| Clicks hex cell while in focus mode | Does nothing (focus mode locks panel) |

---

## Implementation Phases

### Phase 0 — Project Setup
- [ ] `npm create vite@latest GridTrack.Web -- --template react-ts`
- [ ] Install all packages (see Package Install Reference)
- [ ] `npx shadcn@latest init` (dark theme, CSS variables)
- [ ] Add shadcn components: `button card badge skeleton table sheet separator chart sonner`
- [ ] Configure `tailwind.config.ts` (content paths, dark mode: `class`)
- [ ] Import `leaflet/dist/leaflet.css` in `main.tsx` (mandatory — map renders broken without it)
- [ ] Set up `providers.tsx` with QueryClient + ClerkProvider + `<Toaster position="top-right" />`
- [ ] Set up React Router in `router.tsx` with all 5 routes
- [ ] `.env.local`: `VITE_CLERK_PUBLISHABLE_KEY`, `VITE_API_BASE_URL`, `VITE_HUB_URL`, `VITE_USE_MOCK_SIGNALR=true`

### Phase 1 — Shell + Routing
- [ ] `AppShell.tsx`: sidebar + main content area
- [ ] `Sidebar.tsx`: nav links to all 5 routes, role-gated Drivers link, anomaly badge count
- [ ] `ProtectedRoute.tsx`: Clerk auth check + role check
- [ ] Stub `mockData.ts` + `mockRoutes.ts` with all data shapes
- [ ] Skeleton placeholder pages for all routes (just `<h1>` tags)
- [ ] Verify routing works end to end

### Phase 2 — Live Ops Map (Stub Data)
- [ ] `liveStore.ts` + `mapStore.ts` + `focusStore.ts`
- [ ] `LiveMap.tsx`: `<MapContainer preferCanvas={true}>` centered on Damascus (33.5138, 36.2765), zoom 12
- [ ] `DriverMarker.tsx`: `L.divIcon`, reads from `liveStore.drivers`, renders all
- [ ] Load `h3-damascus.geojson` from `/public`, store in `mapStore`
- [ ] `HexGridLayer.tsx`: `<GeoJSON>` on/off via `mapStore.hexGridEnabled`
- [ ] `HeatmapLayer.tsx`: `leaflet.heat` or H3 cell color fallback
- [ ] `MapControls.tsx`: toggle buttons for hex + heatmap
- [ ] `ConnectionStatus.tsx`: hardcoded "Live" in stub phase
- [ ] `SidePanel.tsx` with `DistrictPanel.tsx` and `DriverPanel.tsx` (stub data)
- [ ] Start `mockEmitter.ts`: drivers walk along Damascus routes

### Phase 3 — Focus Mode (Stub Data)
- [ ] `useFocusMode.ts`: full state machine, uses `focusStore`
- [ ] `FocusModePanel.tsx`: Order ID, driver name, ETA countdown, lock toggle
- [ ] `RoutePolyline.tsx`: renders stub polyline from `mockData`
- [ ] `useEtaCountdown.ts`: local tick every second from `etaSeconds`
- [ ] Driver marker opacity logic (`.dimmed` class on non-focused markers)
- [ ] `map.flyTo` on entry, `map.panTo` on auto-follow tick
- [ ] Manual pan → auto-follow off (Leaflet `movestart` + `originalEvent` check)
- [ ] Exit via click, X button, Escape key

### Phase 4 — Toast Notifications
- [ ] Wire `liveStore.pushAnomaly` to call `toast.error(...)` from `sonner`
- [ ] Toast action button: `map.flyTo` + open driver side panel
- [ ] `mapRef` passed from `LiveOpsPage` to enable imperative map calls
- [ ] Test with mock emitter anomaly injection (every 15s)
- [ ] Anomaly badge count in `Sidebar.tsx` driven by `liveStore.anomalyQueue.length`

### Phase 5 — Analytics View (Stub Data)
- [ ] KPI cards: total deliveries, completion rate, active drivers, anomaly rate
- [ ] `DeliveryTrendChart.tsx`: line chart, hourly/daily toggle
- [ ] `AnomalyRateChart.tsx`: bar chart
- [ ] `DistrictVolumeChart.tsx`: district breakdown
- [ ] Date range picker (shared between charts and chatbot tab)
- [ ] Skeleton loaders on all cards + charts
- [ ] Tabs: "Overview" | "AI Analysis"

### Phase 6 — Chatbot Analysis (Stub Data)
- [ ] `ChatbotPanel.tsx`: layout with date picker, message list, input
- [ ] `useChatbot.ts`: conversation state, `loadCsvForRange`, `sendMessage`
- [ ] `ChatMessage.tsx`: user/assistant bubble styles
- [ ] In stub phase: `sendMessage` calls real `POST /api/analysis/chat` (backend can be wired early, independent of rest of frontend)
- [ ] Skeleton while assistant is responding
- [ ] "Clear conversation" button
- [ ] "Load Data" badge showing loaded range

### Phase 7 — Deliveries + Alerts + Drivers Views (Stub Data)
- [ ] `CursorTable.tsx`: generic cursor-paginated table component
- [ ] `DeliveriesPage.tsx`: table + filters (status, district, date range)
- [ ] Click delivery row → enter focus mode (navigates to `/` + triggers focus)
- [ ] `AlertsPage.tsx`: table + date range filter
- [ ] `DriversPage.tsx`: table, admin only, availability toggle stub

### Phase 8 — Wire Real Backend
- [ ] `client.ts`: axios + Clerk token interceptor
- [ ] `useSignalR.ts`: real hub connection (swap mock emitter)
- [ ] All `api/*` files: real endpoint calls
- [ ] React Query integration for all REST views
- [ ] Replace `mockData.ts` constants with real API responses
- [ ] `GET /api/h3/bounds` replaces static GeoJSON (or keep static — it never changes)
- [ ] `GET /api/deliveries/{id}` on focus mode entry
- [ ] `GET /api/export/csv` in `useChatbot.loadCsvForRange`
- [ ] `POST /api/analysis/chat` already wired from Phase 6
- [ ] `VITE_USE_MOCK_SIGNALR=false` in `.env.local`

### Phase 9 — Auth Hardening
- [ ] Verify Clerk JWT flow end to end (frontend → backend validation)
- [ ] Role-gated routes tested with both roles
- [ ] Token refresh handled by Clerk SDK (transparent)

### Phase 10 — Polish
- [ ] Skeleton loaders on all async surfaces (React Query `isLoading`)
- [ ] `ErrorBoundary.tsx` for fatal SignalR disconnect (>30s)
- [ ] `ConnectionStatus.tsx` with real hub state
- [ ] Responsive layout check (sidebar collapses on narrower screens if needed)
- [ ] Map: disable zoom animation during focus mode flyTo if it causes jitter
- [ ] Leaflet attribution positioned non-intrusively

---

## Package Install Reference

```bash
# Core
npm install react-router-dom @tanstack/react-query zustand

# Clerk
npm install @clerk/clerk-react

# shadcn/ui — run after Tailwind configured
npx shadcn@latest init
npx shadcn@latest add button card badge skeleton table sheet separator chart sonner

# Map
npm install react-leaflet leaflet @types/leaflet
npm install leaflet.heat
# No official @types/leaflet.heat — add a minimal .d.ts or use // @ts-ignore on import

# SignalR
npm install @microsoft/signalr

# Geo
npm install @turf/turf

# HTTP
npm install axios
```

---

## Known Gotchas

| Issue | Fix |
|---|---|
| Map renders with 0 height | Wrap `<MapContainer>` in a div with explicit `h-full` or pixel height |
| Leaflet CSS missing | Import `leaflet/dist/leaflet.css` in `main.tsx` before anything else |
| `preferCanvas={true}` + GeoJSON click events | Canvas mode disables per-feature mouse events on `<GeoJSON>`. Use `interactive={false}` on non-clickable layers; for HexGridLayer, keep `interactive={true}` and attach `onEachFeature` click handler as normal — it still works |
| `leaflet.heat` no React-Leaflet wrapper | Implement via `createElementHook` from react-leaflet; ~30 lines |
| Zustand `Record` mutation | Spread on update: `{ ...state.drivers, [id]: updated }` |
| Clerk token in SignalR connection | Pass token via `accessTokenFactory` option in `HubConnectionBuilder` |
| `map.flyTo` inside React component | Use `useMap()` hook (only works inside `<MapContainer>` children). For calls from outside (toast click), pass a `mapRef` |
| Auto-follow pan fighting user pan | Check `e.originalEvent` on Leaflet `movestart`; programmatic pans have no `originalEvent` |
| `leaflet` SSR import crash | Not applicable with Vite (no SSR), but avoid importing Leaflet outside component scope |
| CSV too large for LLM context | Truncate to first N rows if `csvData.length > 80000` chars before sending to API |

---

## Environment Variables

```env
VITE_CLERK_PUBLISHABLE_KEY=pk_test_...
VITE_API_BASE_URL=http://localhost:5000
VITE_HUB_URL=http://localhost:5000/hubs/dashboard
VITE_USE_MOCK_SIGNALR=true
```

Set `VITE_USE_MOCK_SIGNALR=false` when backend SignalR hub is ready.

---

## Definition of Done (per phase)

- Phase 0: App boots, routing works, Clerk login/logout works.
- Phase 1: All 5 routes render their placeholder, sidebar nav highlights correctly.
- Phase 2: Drivers walk Damascus roads from mock emitter, hex grid and heatmap toggle correctly, side panel shows district/driver data on click.
- Phase 3: Focus mode entry/exit works, ETA counts down, dimmed markers work, auto-follow with lock toggle works.
- Phase 4: Anomaly toast appears every ~15s in dev, clicking it flies to the driver.
- Phase 5: All chart components render with stub data, skeleton loaders show before data resolves, tabs switch correctly.
- Phase 6: Chatbot sends a question, gets a real LLM reply, follow-up question has context from previous answer.
- Phase 7: Tables render, cursor pagination works with stub data, clicking delivery row enters focus mode.
- Phase 8: All stub data replaced, real SignalR stream drives map, all REST endpoints consumed.
- Phase 9: Both roles behave correctly, admin-only route blocked for stakeholders.
- Phase 10: No layout breaks, error boundary tested by manually disconnecting, connection status reflects real hub state.
