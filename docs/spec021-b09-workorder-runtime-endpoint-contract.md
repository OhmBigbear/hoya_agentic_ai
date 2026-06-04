# Spec021 B0.9 Workorder Agent Runtime Endpoint Contract

This is the canonical Hoya UI-side contract for the passive Workorder Agent runtime call. The UI does not mutate workorders, call HITL approval APIs, or fetch directly from components. Runtime calls go through `src/services/workorderAgentRuntimeApi.ts`, which uses the helpers in `src/services/workorderAgentRuntimeContract.ts`.

## Endpoint

The adapter selects the endpoint from:

- `VITE_WORKORDER_AGENT_RUNTIME_URL` as a full endpoint override.
- `VITE_WORKORDER_AGENT_RUNTIME_BASE_URL` plus `VITE_WORKORDER_AGENT_RUNTIME_PATH`.

If no base URL or full endpoint URL is configured, the adapter returns a diagnostics-only disabled payload and does not call `fetch`. Core logic does not hardcode localhost.

## Request Envelope

```json
{
  "query": "Summarize current maintenance blockers",
  "surface_id": "maintenance.workorders",
  "request_source": "hoya_ui.developer_diagnostics",
  "selected_workorder_id": "WO-100",
  "selected_machine_id": "MACHINE-7A",
  "context": {
    "filters": {},
    "workspace_state": {}
  },
  "client_trace_id": "uuid-or-client-generated-id",
  "payload_version": "1.0"
}
```

The helper `buildWorkorderRuntimeRequest()` accepts the B0.8 aliases `question`, `machine_id`, and `context_metadata`, then emits the canonical B0.9 envelope above.

## Response Envelope

```json
{
  "payload_version": "2.0",
  "trace_metadata": {
    "trace_id": "trace-runtime-workorder-021",
    "agent_id": "maint-workorder-agent",
    "run_id": "run-runtime-021-b09"
  },
  "summary": {},
  "widgets": [],
  "readonly_actions": [],
  "diagnostics": []
}
```

The helper `parseWorkorderRuntimeResponse()` preserves valid runtime payloads for the existing widget registry. Malformed successful responses become a diagnostics-only fallback payload with `runtime_invalid_response`.

## Error Envelope

```json
{
  "error": {
    "error_code": "agent_unavailable",
    "message": "agent unavailable",
    "retryable": true,
    "trace_id": "trace-error-021",
    "details": {}
  }
}
```

The helper `parseWorkorderRuntimeError()` also accepts legacy `error.code` and top-level `message` fields. Error payloads are converted into diagnostics-only fallback payloads and are safe to render through the existing developer diagnostics preview.

## Diagnostics

Runtime diagnostics expose:

- endpoint URL/path selected
- `client_trace_id`
- runtime `trace_id` when returned
- request/response `payload_version`
- `error_code` when failed

These diagnostics are developer-only metadata in the existing preview panel and do not change dashboard layout or theme.
