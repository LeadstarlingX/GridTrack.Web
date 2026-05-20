# AnalysisController

Base path: `/api/analysis`
Auth: Bearer JWT (Clerk) required.
Roles: `admin`, `stakeholder`.

---

## POST /api/analysis/chat

Sends a chat message to the AI analysis service with conversation history and CSV context. The backend injects a system prompt on the first message and passes `csvData` as additional context to the LLM.

### Request Body

```json
{
  "messages": [
    { "role": "user", "content": "What district had the most delays this week?" },
    { "role": "assistant", "content": "Based on the data, Midan had 12 delay anomalies..." },
    { "role": "user", "content": "And which driver was most involved?" }
  ],
  "csvData": "delivery_id,status,district_id,...\n..."
}
```

**TypeScript DTO**: `ChatRequest`

| Field      | Type     | Description |
|------------|----------|-------------|
| `messages` | `Array<{ role: 'user' \| 'assistant'; content: string }>` | Full conversation history including the new user message as the last entry. The backend prepends the system prompt — do not include it in the messages array. |
| `csvData`  | `string` | CSV text content (already truncated to 80,000 chars client-side). Injected as context for the first turn only, or passed on every request — backend decides injection strategy. |

### Response — 200 OK

```json
{
  "reply": "Based on the CSV data, driver Ahmed Al-Sayed was involved in 4 of the 12 delay alerts in Midan..."
}
```

**TypeScript DTO**: `ChatResponse`

### Notes
- The backend should prepend a **system prompt** on the first message establishing the assistant's role: analyzing GridTrack operational CSV data, concise answers, no hallucinated IDs.
- LLM provider: Groq (primary) → Google AI (fallback). Backend selects provider and handles fallback transparently.
- `csvData` is injected into the first `user` message as additional context, or passed as a separate context block — the injection strategy is backend's choice.
- Response is not streamed — the frontend waits for the full reply before displaying it.

### Error Codes

| HTTP | Code | When |
|------|------|------|
| 400  | `VALIDATION_ERROR` | Empty `messages` array or missing `csvData` |
| 401  | `UNAUTHORIZED` | Missing or expired JWT |
| 503  | `LLM_UNAVAILABLE` | Both Groq and Google AI failed to respond |
