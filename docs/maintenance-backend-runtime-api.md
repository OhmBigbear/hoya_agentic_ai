# Maintenance Backend Runtime API

This runtime adds a lightweight Node HTTP API for Workorder Tracking without changing the Vite frontend. It reads PostgreSQL maintenance views and normalized tables created by the maintenance database setup.

## Architecture

- `src/server/server.mjs` starts the Node HTTP server.
- `src/server/db/postgres.mjs` creates a `pg` connection pool from `DATABASE_URL`, applies timeouts, and maps DB errors to JSON-safe API errors.
- `src/server/maintenance/repositories/*` owns SQL against approved maintenance views and normalized detail tables.
- `src/server/maintenance/services/*` maps repository rows to the Round 2 maintenance contracts.
- `src/server/maintenance/routes/maintenanceRoutes.mjs` exposes JSON routes under `/api/maintenance/*`.

The runtime intentionally does not add UI pages, Agentic Core tools, skills, or agents.

## Environment

Backend runtime:

- `DATABASE_URL`: required PostgreSQL connection string.
- `MAINTENANCE_API_HOST`: optional, default `0.0.0.0` so the API is reachable from browsers, WSL, Docker, and local network development environments.
- `MAINTENANCE_API_PORT`: optional, default `3101`.
- `MAINTENANCE_API_CORS_ORIGINS`: optional comma- or space-separated browser origin allowlist. Defaults to `http://localhost:5173` and `http://127.0.0.1:5173` for Vite development. Set to `*` only for explicit local development scenarios; production should use concrete origins.
- `PGPOOL_MAX`: optional pool size, default `10`.
- `PGQUERY_TIMEOUT_MS`: optional query timeout, default `15000`.
- `PGSTATEMENT_TIMEOUT_MS`: optional statement timeout, default `15000`.

Frontend Maintenance Workorder Tracking UI:

- `VITE_MAINTENANCE_API_BASE_URL`: optional browser API base URL, default `http://localhost:3101`. For WSL/browser development, prefer `http://127.0.0.1:3101`.

Example:

```bash
VITE_MAINTENANCE_API_BASE_URL=http://127.0.0.1:3101 npm run dev
```

If the frontend runs from a different dev origin, add it to the backend allowlist:

```bash
MAINTENANCE_API_CORS_ORIGINS=http://localhost:5173,http://127.0.0.1:5173 npm run server:maintenance
```

The Maintenance Workorder Tracking UI calls this runtime directly. It does not use the Agentic Core API client and is not blocked by `VITE_APP_MODE=mock`.

Secrets are not logged. If `DATABASE_URL` is missing, startup fails with a clear non-secret error.

## Run Commands

```bash
npm run server:maintenance
npm run server:maintenance:dev
npm run test:maintenance-backend
```

The frontend remains unchanged:

```bash
npm run dev
npm run build
npm test
```

## Endpoints

- `GET /api/health`
- `GET /api/maintenance/workorders`
- `GET /api/maintenance/workorders/:workorderNo`
- `GET /api/maintenance/equipment/:equipmentNo/history`
- `GET /api/maintenance/analytics/mtbf-mttr`
- `GET /api/maintenance/workorders/:workorderNo/parts`
- `GET /api/maintenance/analytics/hold-reasons`
- `GET /api/maintenance/analytics/repeat-failures`
- `GET /api/maintenance/analytics/stock-risk`
- `GET /api/maintenance/dashboard-summary`

List responses include `data`, `total`, `limit`, `offset`, and `generated_at`. Item responses include `data` and `generated_at`. Errors return:

```json
{
  "error": {
    "code": "DATABASE_ERROR",
    "message": "Maintenance database query failed."
  },
  "generated_at": "2026-05-25T00:00:00.000Z"
}
```

## DB Sources

Runtime API queries use these views first:

- `maintenance.v_workorder_tracking`
- `maintenance.v_machine_maintenance_history`
- `maintenance.v_mtbf_mttr_base`
- `maintenance.v_spare_part_usage_by_workorder`
- `maintenance.v_hold_reason_summary`
- `maintenance.v_repeat_failure_candidates`
- `maintenance.v_stock_risk_summary`

Workorder detail also reads normalized tables:

- `maintenance.equipment`
- `maintenance.work_order_task`
- `maintenance.work_order_hold_history`

No runtime API module references raw staging tables.

## Validation

Run:

```bash
npm run build
npm test
npm run test:maintenance-workorder
npm run test:maintenance-backend
```

`test:maintenance-backend` does not require a live database. It validates parameterized query builders, route success and error envelopes, pagination defaults, missing `DATABASE_URL` handling, and absence of staging table references in `src/server`.

## Next Agentic Core Step

The next backend step is to expose these same service methods as Agentic Core tools, preserving the endpoint contracts and source-view restrictions documented in `docs/maintenance-agent-tool-plan.md`.
