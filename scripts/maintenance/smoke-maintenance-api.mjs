#!/usr/bin/env node
import { fileURLToPath } from 'node:url';

const DEFAULT_BASE_URL = 'http://localhost:8787';

export function usageText() {
  return `Usage: node scripts/maintenance/smoke-maintenance-api.mjs

Uses MAINTENANCE_API_BASE_URL or defaults to ${DEFAULT_BASE_URL}.
Validates endpoint status codes and response shapes without asserting customer values.`;
}

function usage() {
  console.log(usageText());
}

async function main() {
  if (process.argv.includes('--help') || process.argv.includes('-h')) {
    usage();
    return;
  }

  const baseUrl = (process.env.MAINTENANCE_API_BASE_URL || DEFAULT_BASE_URL).replace(/\/$/, '');
  const checks = [];

  const health = await getJson(baseUrl, '/api/health');
  assertShape(checks, 'GET /api/health', health.body?.status === 'ok' && health.body?.service);

  const workorders = await getJson(baseUrl, '/api/maintenance/workorders?limit=5');
  assertEnvelope(checks, 'GET /api/maintenance/workorders?limit=5', workorders.body, true);

  const dashboard = await getJson(baseUrl, '/api/maintenance/dashboard-summary');
  assertShape(checks, 'GET /api/maintenance/dashboard-summary', dashboard.body?.data && typeof dashboard.body.data === 'object');

  const holds = await getJson(baseUrl, '/api/maintenance/analytics/hold-reasons');
  assertEnvelope(checks, 'GET /api/maintenance/analytics/hold-reasons', holds.body, true);

  const stockRisk = await getJson(baseUrl, '/api/maintenance/analytics/stock-risk');
  assertEnvelope(checks, 'GET /api/maintenance/analytics/stock-risk', stockRisk.body, true);

  const firstWorkorder = workorders.body.data[0];
  if (firstWorkorder?.workorder_no) {
    const encodedWorkorderNo = encodeURIComponent(firstWorkorder.workorder_no);
    const detail = await getJson(baseUrl, `/api/maintenance/workorders/${encodedWorkorderNo}`);
    assertShape(checks, 'GET /api/maintenance/workorders/{workorderNo}', detail.body?.data?.workorder_no === firstWorkorder.workorder_no);

    const parts = await getJson(baseUrl, `/api/maintenance/workorders/${encodedWorkorderNo}/parts`);
    assertEnvelope(checks, 'GET /api/maintenance/workorders/{workorderNo}/parts', parts.body, true);
  } else {
    checks.push({ name: 'workorder detail and parts checks', ok: true, note: 'Skipped because list returned no work orders.' });
  }

  const equipmentNo = firstWorkorder?.equipment_no;
  if (equipmentNo) {
    const history = await getJson(baseUrl, `/api/maintenance/equipment/${encodeURIComponent(equipmentNo)}/history`);
    assertEnvelope(checks, 'GET /api/maintenance/equipment/{equipmentNo}/history', history.body, true);
  } else {
    checks.push({ name: 'equipment history check', ok: true, note: 'Skipped because list returned no equipment number.' });
  }

  const failed = checks.filter((check) => !check.ok);
  console.log('Maintenance API smoke test');
  console.log(`Base URL: ${baseUrl}`);
  console.log(`Result: ${failed.length === 0 ? 'PASS' : 'FAIL'} (${checks.length - failed.length}/${checks.length} checks passed)`);
  for (const check of checks) {
    console.log(`${check.ok ? 'PASS' : 'FAIL'} ${check.name}${check.note ? ` - ${check.note}` : ''}`);
  }

  if (failed.length) {
    process.exitCode = 1;
  }
}

export async function getJson(baseUrl, path) {
  const url = `${baseUrl}${path}`;
  let response;
  try {
    response = await fetch(url, { headers: { Accept: 'application/json' } });
  } catch (error) {
    throw new Error(`Request failed for ${url}: ${error.message}`);
  }

  const text = await response.text();
  let body;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    throw new Error(`Non-JSON response from ${url}: HTTP ${response.status}`);
  }

  if (!response.ok) {
    throw new Error(`Non-2xx response from ${url}: HTTP ${response.status} ${JSON.stringify(body)}`);
  }

  return { response, body };
}

function assertEnvelope(checks, name, body, dataMustBeArray) {
  assertShape(
    checks,
    name,
    body
      && (dataMustBeArray ? Array.isArray(body.data) : body.data !== undefined)
      && Object.prototype.hasOwnProperty.call(body, 'generated_at'),
  );
}

function assertShape(checks, name, ok) {
  checks.push({ name, ok: Boolean(ok) });
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    console.error(error.message);
    process.exit(1);
  });
}
