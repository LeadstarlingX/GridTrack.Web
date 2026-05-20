# ExportController

Base path: `/api/export`
Auth: Bearer JWT (Clerk) required.
Roles: `admin`, `stakeholder` — export access.

---

## POST /api/export/csv

Exports delivery data as a CSV file for a given date range and time-of-day filter. Used by two consumers:

1. **Analytics page** — user clicks "Download CSV" / "Download Full CSV" to save the file locally.
2. **Chatbot** — the frontend POSTs with `mode: 'range'` and reads the response as text to send to the AI analysis endpoint.

### Request Body

```json
{
  "mode": "range",
  "from": "2026-05-01",
  "to": "2026-05-20",
  "days": ["mon", "tue", "wed", "thu", "fri"],
  "fromHour": 8,
  "toHour": 18
}
```

**TypeScript DTO**: `CsvExportRequest`

| Field     | Type       | Required | Description |
|-----------|------------|----------|-------------|
| `mode`    | `string`   | Yes      | `range` — filtered export. `full` — all data (ignores `from`/`to`/`days`/hours). |
| `from`    | `string`   | Yes*     | ISO date. Required when `mode = 'range'`. |
| `to`      | `string`   | Yes*     | ISO date. Required when `mode = 'range'`. |
| `days`    | `string[]` | No       | Day-of-week filter. Values: `mon`, `tue`, `wed`, `thu`, `fri`, `sat`, `sun`. If empty or omitted, include all days. |
| `fromHour`| `number`   | No       | Hour-of-day lower bound `0–23`. Default: 0. |
| `toHour`  | `number`   | No       | Hour-of-day upper bound `0–23`. Default: 23. |

### Response — 200 OK

`Content-Type: text/csv`

Streaming CSV with the following columns:

```
delivery_id,status,district_id,district_name,driver_id,driver_name,created_at,eta_seconds,anomaly_type
```

### Notes
- The chatbot reads this as text (`responseType: 'text'` in axios) and the frontend truncates to `APP_CONFIG.chatbot.csvMaxChars` (80,000 chars) before sending to the AI.
- The download button triggers the browser's save dialog — the response does not need `Content-Disposition` set, the frontend creates a blob URL itself.
- For `mode: 'full'`, omit date/hour filters entirely and return all available data.

### Error Codes

| HTTP | Code | When |
|------|------|------|
| 400  | `VALIDATION_ERROR` | `mode = 'range'` without `from`/`to`, or invalid day values |
| 401  | `UNAUTHORIZED` | Missing or expired JWT |
| 403  | `FORBIDDEN` | Role not permitted |
