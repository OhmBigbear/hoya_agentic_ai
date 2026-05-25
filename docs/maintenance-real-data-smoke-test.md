# Maintenance Real Data Smoke Test

This validates the real CSV import pipeline end to end:

`uploads/*.csv` -> maintenance staging tables -> normalized tables -> agent-ready views -> backend API.

## Prerequisites

- PostgreSQL reachable from this machine.
- `psql` available on `PATH` for rebuild/import/normalize commands.
- Node dependencies installed with `npm ci`.
- Real CSV exports placed in `./uploads`. The directory is gitignored and must not be committed.

Expected upload filenames are defined in `scripts/maintenance/maintenance-csv-lib.mjs`.

## DATABASE_URL

Set `DATABASE_URL` in your shell before database commands:

```bash
export DATABASE_URL='postgres://user:password@host:5432/database'
```

Do not paste the value into docs, source files, or command output.

## Rebuild, Import, Normalize

Run the full database rebuild:

```bash
npm run maintenance:db:rebuild
```

Or run the steps separately:

```bash
npm run maintenance:import
npm run maintenance:normalize
```

The CSV importer reads `./uploads` by default, handles UTF-8 BOM files, skips report preambles by detecting headers, and preserves Thai text as UTF-8. Import is repeatable for the same source files. Normalization uses upserts keyed by stable business/source keys.

## Start Backend

In a separate shell with `DATABASE_URL` set:

```bash
npm run server:maintenance
```

By default the backend listens on `http://127.0.0.1:3101`. If needed:

```bash
MAINTENANCE_API_PORT=8787 npm run server:maintenance
```

## Smoke Tests

Validate database state and agent-ready views:

```bash
npm run maintenance:smoke:data
```

Validate the HTTP API:

```bash
MAINTENANCE_API_BASE_URL=http://127.0.0.1:3101 npm run maintenance:smoke:api
```

The API smoke script defaults to `http://localhost:8787` when `MAINTENANCE_API_BASE_URL` is not set.

## Expected Row Counts

For real data, these should be greater than zero:

- staging tables for every configured CSV dataset
- `maintenance.equipment`
- `maintenance.work_order`
- `maintenance.work_order_task`
- `maintenance.part_catalog`
- `maintenance.stock_balance`
- `maintenance.v_workorder_tracking`
- `maintenance.v_machine_maintenance_history`
- `maintenance.v_spare_part_usage_by_workorder`
- `maintenance.v_hold_reason_summary`
- `maintenance.v_stock_risk_summary`

`maintenance.v_mtbf_mttr_base` may be empty when the imported work orders do not contain breakdown, downtime, or repair-duration signals. The smoke test reports that as a clear no-data reason instead of treating the view query as broken.

## Troubleshooting

`DATABASE_URL missing`: export `DATABASE_URL` in the same shell that runs database or backend commands.

`CSV missing`: confirm all expected files exist under `./uploads` and filenames match `scripts/maintenance/maintenance-csv-lib.mjs`.

`Date parse issue`: supported formats are `DD/MM/YYYY`, `DD/MM/YYYY HH:mm`, `DD/MM/YYYY HH:mm:ss`, and two-digit-year variants. Invalid calendar dates normalize to `NULL`.

`No rows in views`: rerun `npm run maintenance:import`, then `npm run maintenance:normalize`, then `npm run maintenance:smoke:data`. Check staging and normalized counts in the smoke output.

`Backend not running`: start `npm run server:maintenance` and set `MAINTENANCE_API_BASE_URL` to the printed host and port.

`PostgreSQL connection refused`: verify the database host, port, credentials, firewall, and that PostgreSQL is accepting TCP connections.
