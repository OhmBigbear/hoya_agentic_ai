#!/usr/bin/env node
import { fileURLToPath } from 'node:url';
import { DATASETS, runPsqlRows } from './maintenance-csv-lib.mjs';

const REQUIRED_NORMALIZED = [
  'equipment',
  'work_order',
  'work_order_task',
  'part_catalog',
  'stock_balance',
];

const REQUIRED_VIEWS = [
  'v_workorder_tracking',
  'v_machine_maintenance_history',
  'v_mtbf_mttr_base',
  'v_spare_part_usage_by_workorder',
  'v_hold_reason_summary',
  'v_stock_risk_summary',
];

export function usageText() {
  return `Usage: node scripts/maintenance/smoke-maintenance-real-data.mjs

Requires DATABASE_URL. Validates maintenance staging tables, normalized tables,
agent-ready views, and representative API-level database queries.`;
}

function usage() {
  console.log(usageText());
}

async function main() {
  if (process.argv.includes('--help') || process.argv.includes('-h')) {
    usage();
    return;
  }

  requireDatabaseUrl(process.env);

  const checks = [];
  const summary = {
    schema: null,
    staging: {},
    normalized: {},
    views: {},
    api_level_queries: {},
  };

  const schemaRows = await query('schema', 'verify maintenance schema', `
    SELECT EXISTS (
      SELECT 1 FROM information_schema.schemata WHERE schema_name = 'maintenance'
    ) AS exists
  `);
  summary.schema = Boolean(schemaRows[0]?.exists);
  addCheck(checks, 'maintenance schema exists', summary.schema);

  for (const dataset of DATASETS) {
    const countRows = await query(dataset.key, `count staging table ${dataset.table}`, `SELECT count(*)::int AS count FROM ${dataset.table}`);
    summary.staging[dataset.table] = countRows[0]?.count ?? 0;
    addCheck(checks, `${dataset.table} has staging rows`, summary.staging[dataset.table] > 0);
  }

  for (const table of REQUIRED_NORMALIZED) {
    const countRows = await query(table, `count normalized table maintenance.${table}`, `SELECT count(*)::int AS count FROM maintenance.${table}`);
    summary.normalized[`maintenance.${table}`] = countRows[0]?.count ?? 0;
    addCheck(checks, `maintenance.${table} has normalized rows`, summary.normalized[`maintenance.${table}`] > 0);
  }

  const viewRows = await query('views', 'verify required views exist', `
    SELECT table_name
    FROM information_schema.views
    WHERE table_schema = 'maintenance'
      AND table_name = ANY($1::text[])
  `, [REQUIRED_VIEWS]);
  const existingViews = new Set(viewRows.map((row) => row.table_name));
  for (const view of REQUIRED_VIEWS) {
    summary.views[`maintenance.${view}`] = existingViews.has(view);
    addCheck(checks, `maintenance.${view} exists`, summary.views[`maintenance.${view}`]);
  }

  await countView(checks, summary, 'workorder_tracking', 'maintenance.v_workorder_tracking', true);
  await countView(checks, summary, 'machine_maintenance_history', 'maintenance.v_machine_maintenance_history', true);
  await countView(checks, summary, 'spare_part_usage_by_workorder', 'maintenance.v_spare_part_usage_by_workorder', true);
  await countView(checks, summary, 'hold_reason_summary', 'maintenance.v_hold_reason_summary', true);
  await countView(checks, summary, 'stock_risk_summary', 'maintenance.v_stock_risk_summary', true);
  await countView(checks, summary, 'mtbf_mttr_base', 'maintenance.v_mtbf_mttr_base', false);

  const apiQueries = {
    workorders: `SELECT workorder_no, equipment_no, status FROM maintenance.v_workorder_tracking ORDER BY coalesce(act_work_start, plan_start) DESC NULLS LAST, workorder_no LIMIT 5`,
    dashboard_summary: `SELECT count(*)::int AS workorder_count, coalesce(sum(down_time_hours), 0) AS total_downtime_hours FROM maintenance.v_workorder_tracking`,
    hold_reasons: `SELECT hold_reason_description, hold_count FROM maintenance.v_hold_reason_summary ORDER BY hold_count DESC LIMIT 5`,
    stock_risk: `SELECT catalogue_no, stock_risk FROM maintenance.v_stock_risk_summary ORDER BY catalogue_no LIMIT 5`,
  };

  for (const [name, sql] of Object.entries(apiQueries)) {
    const rows = await query(name, `run API-level query ${name}`, sql);
    summary.api_level_queries[name] = rows.length;
    addCheck(checks, `API-level query ${name} returns rows`, rows.length > 0);
  }

  const failed = checks.filter((check) => !check.ok);
  printHumanSummary(checks, summary);
  console.log(JSON.stringify({ ok: failed.length === 0, checks, summary }, null, 2));

  if (failed.length) {
    process.exitCode = 1;
  }
}

export function requireDatabaseUrl(env = process.env) {
  if (!env.DATABASE_URL?.trim()) {
    throw new Error('DATABASE_URL is required for maintenance real-data smoke testing.');
  }
}

async function countView(checks, summary, key, viewName, requireRows) {
  const rows = await query(key, `count ${viewName}`, `SELECT count(*)::int AS count FROM ${viewName}`);
  const count = rows[0]?.count ?? 0;
  summary.api_level_queries[key] = count;
  if (requireRows) {
    addCheck(checks, `${viewName} returns rows`, count > 0);
  } else {
    addCheck(checks, `${viewName} query succeeds`, true, count > 0 ? undefined : 'No MTBF/MTTR rows. This is acceptable when imported work orders do not contain breakdown, downtime, or repair-duration signals.');
  }
}

async function query(dataset, stage, sql, values = []) {
  try {
    return await runPsqlRows(sql, values);
  } catch (error) {
    error.message = `[${dataset}] ${stage}: ${error.message}`;
    throw error;
  }
}

function addCheck(checks, name, ok, note) {
  checks.push({ name, ok, ...(note ? { note } : {}) });
}

function printHumanSummary(checks, summary) {
  const passed = checks.filter((check) => check.ok).length;
  const failed = checks.length - passed;
  console.log('Maintenance real-data smoke test');
  console.log(`Result: ${failed === 0 ? 'PASS' : 'FAIL'} (${passed}/${checks.length} checks passed)`);
  console.log(`Schema: ${summary.schema ? 'present' : 'missing'}`);
  console.log(`Staging rows: ${formatCounts(summary.staging)}`);
  console.log(`Normalized rows: ${formatCounts(summary.normalized)}`);
}

function formatCounts(counts) {
  return Object.entries(counts)
    .map(([name, count]) => `${name}=${count}`)
    .join(', ');
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    console.error(error.message);
    process.exit(1);
  });
}
