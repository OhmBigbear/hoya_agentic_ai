import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

import { getJson, usageText as apiSmokeUsageText } from './maintenance/smoke-maintenance-api.mjs';
import { requireDatabaseUrl as requireSmokeDatabaseUrl, usageText as dataSmokeUsageText } from './maintenance/smoke-maintenance-real-data.mjs';
import { createCorsHandler, getAllowedCorsOrigins } from '../src/server/cors.mjs';
import { assertDatabaseUrl, MissingDatabaseUrlError } from '../src/server/db/postgres.mjs';
import {
  buildHoldReasonsQuery,
  buildMachineHealthQuery,
  buildMtbfMttrQuery,
  buildReliabilityMtbfQuery,
  buildReliabilityMttrQuery,
} from '../src/server/maintenance/repositories/maintenanceAnalyticsRepository.mjs';
import { buildStockRiskQuery } from '../src/server/maintenance/repositories/maintenanceInventoryRepository.mjs';
import { buildWorkordersQuery } from '../src/server/maintenance/repositories/maintenanceWorkorderRepository.mjs';
import { createMaintenanceRouter } from '../src/server/maintenance/routes/maintenanceRoutes.mjs';

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

testQueryBuilders();
await testRoutes();
await testCors();
await testNoStagingRuntimeReferences();
await testSmokeScriptHelpAndFailureModes();
testNoCommittedUploads();
testMissingDatabaseUrl();

console.log('Maintenance backend API tests passed.');

function testQueryBuilders() {
  const workorders = buildWorkordersQuery({
    site: "HOYA-BKK' OR 1=1 --",
    status: 'open',
    from: '2026-01-01',
    to: '2026-02-01',
    limit: 9999,
    offset: 5,
  });

  assert.match(workorders.text, /maintenance\.v_workorder_tracking/);
  assert.doesNotMatch(workorders.text, /OR 1=1/);
  assert.deepEqual(workorders.values.slice(0, 4), ["HOYA-BKK' OR 1=1 --", 'open', '2026-01-01', '2026-02-01']);
  assert.equal(workorders.limit, 500);
  assert.equal(workorders.offset, 5);
  assert.match(workorders.text, /LIMIT \$5 OFFSET \$6/);

  const defaulted = buildWorkordersQuery({ limit: '-1', offset: '-9' });
  assert.equal(defaulted.limit, 50);
  assert.equal(defaulted.offset, 0);

  const mtbf = buildMtbfMttrQuery({ equipment_no: 'MC-01', limit: 10 });
  assert.match(mtbf.text, /maintenance\.v_mtbf_mttr_base/);
  assert.deepEqual(mtbf.values, ['MC-01', 10, 0]);

  const reliabilityMtbf = buildReliabilityMtbfQuery({ section: 'MC1', machine_no: 'MC-01', period_month: '2026-06-01', limit: 3, offset: 2 });
  assert.match(reliabilityMtbf.text, /maintenance\.v_mtbf_mttr_base base/);
  assert.match(reliabilityMtbf.text, /LEFT JOIN maintenance\.equipment equipment/);
  assert.doesNotMatch(reliabilityMtbf.text, /maintenance\.stg_/i);
  assert.deepEqual(reliabilityMtbf.values, ['2026-06-01', 'MC-01', 'MC1', 'MC1%', 3, 2]);
  assert.match(reliabilityMtbf.text, /ORDER BY period_month DESC NULLS LAST, mtbf_hours ASC NULLS LAST/);

  const reliabilityMttr = buildReliabilityMttrQuery({ machine_type: 'GRINDER', limit: 4 });
  assert.deepEqual(reliabilityMttr.values, ['GRINDER', 4, 0]);
  assert.match(reliabilityMttr.text, /mttr_minutes DESC NULLS LAST/);

  const machineHealth = buildMachineHealthQuery({ limit: 5 });
  assert.deepEqual(machineHealth.values, [5, 0]);
  assert.match(machineHealth.text, /health_score ASC NULLS LAST/);

  const holds = buildHoldReasonsQuery({ site: 'HOYA-BKK', department: 'ENG' });
  assert.match(holds.text, /maintenance\.v_hold_reason_summary/);
  assert.deepEqual(holds.values.slice(0, 2), ['HOYA-BKK', 'ENG']);

  const stock = buildStockRiskQuery({ catalogue_no: 'BRG-01', stock_risk: 'zero_stock' });
  assert.match(stock.text, /maintenance\.v_stock_risk_summary/);
  assert.deepEqual(stock.values.slice(0, 2), ['BRG-01', 'zero_stock']);
}

async function testRoutes() {
  const calls = [];
  const router = createMaintenanceRouter({
    workorderService: {
      async listWorkorders(filters) {
        calls.push(['listWorkorders', filters]);
        return {
          data: [{ workorder_no: 'WO-1001', total_repair_time_hours: 0, down_time_hours: 2 }],
          total: 1,
          limit: 25,
          offset: 0,
        };
      },
      async getWorkorderDetail(workorderNo) {
        if (workorderNo === 'WO-404') {
          return null;
        }
        return { workorder_no: workorderNo, tasks: [], parts: [], hold_history: [], total_repair_time_hours: 0, down_time_hours: 0 };
      },
      async listEquipmentHistory(equipmentNo) {
        return { data: [{ workorder_no: 'WO-0999', equipment_no: equipmentNo }], total: 1, limit: 50, offset: 0 };
      },
      async listPartsByWorkorder(workorderNo) {
        return { data: [{ workorder_no: workorderNo, transaction_count: 1, issued_qty: 0, movement_qty: 1 }], total: 1, limit: 1, offset: 0 };
      },
    },
    analyticsService: {
      async listMtbfMttr() {
        return { data: [{ equipment_no: 'MC-01', failure_count: 2, total_downtime_hours: 3 }], total: 1, limit: 50, offset: 0 };
      },
      async listReliabilityMtbf(filters) {
        calls.push(['listReliabilityMtbf', filters]);
        return { data: [{ machine_no: 'MC-01', period_month: '2026-06-01', mtbf_hours: 12.5 }], total: 1, limit: 3, offset: 0 };
      },
      async listReliabilityMttr(filters) {
        calls.push(['listReliabilityMttr', filters]);
        return { data: [{ machine_no: 'MC-01', period_month: '2026-06-01', mttr_minutes: 44 }], total: 1, limit: 3, offset: 0 };
      },
      async listMachineHealth(filters) {
        calls.push(['listMachineHealth', filters]);
        return { data: [{ machine_no: 'MC-01', period_month: '2026-06-01', health_score: 71, health_band: 'healthy' }], total: 1, limit: 3, offset: 0 };
      },
      async listHoldReasons() {
        return { data: [{ hold_reason_description: 'Waiting part', hold_count: 2 }], total: 1, limit: 50, offset: 0 };
      },
      async listRepeatFailures() {
        return { data: [{ equipment_no: 'MC-01', workorder_count: 2 }], total: 1, limit: 50, offset: 0 };
      },
      async listStockRisk() {
        return { data: [{ catalogue_no: 'BRG-01', stock_risk: 'zero_stock' }], total: 1, limit: 50, offset: 0 };
      },
      async getDashboardSummary() {
        return { open_workorder_count: 1, overdue_workorder_count: 0, on_hold_workorder_count: 0, completed_workorder_count: 1 };
      },
    },
  });

  const health = await invoke(router, '/api/health');
  assert.equal(health.statusCode, 200);
  assert.equal(health.body.service, 'hoya-ui-maintenance-api');

  const workorders = await invoke(router, '/api/maintenance/workorders?site=HOYA-BKK&limit=25');
  assert.equal(workorders.statusCode, 200);
  assert.equal(workorders.body.total, 1);
  assert.equal(workorders.body.limit, 25);
  assert.equal(workorders.body.data[0].workorder_no, 'WO-1001');
  assert.deepEqual(calls[0], ['listWorkorders', { site: 'HOYA-BKK', limit: '25' }]);

  const detail = await invoke(router, '/api/maintenance/workorders/WO-1001');
  assert.equal(detail.statusCode, 200);
  assert.equal(detail.body.data.workorder_no, 'WO-1001');

  const notFound = await invoke(router, '/api/maintenance/workorders/WO-404');
  assert.equal(notFound.statusCode, 404);
  assert.equal(notFound.body.error.code, 'WORKORDER_NOT_FOUND');

  const mtbfEndpoint = await invoke(router, '/api/maintenance/analytics/mtbf?section=MC1&limit=3');
  assert.equal(mtbfEndpoint.statusCode, 200);
  assert.equal(mtbfEndpoint.body.total, 1);
  assert.equal(mtbfEndpoint.body.limit, 3);
  assert.equal(mtbfEndpoint.body.data[0].machine_no, 'MC-01');
  assert.deepEqual(calls.at(-1), ['listReliabilityMtbf', { section: 'MC1', limit: '3' }]);

  const mttrEndpoint = await invoke(router, '/api/maintenance/analytics/mttr?machine_type=GRINDER&limit=3');
  assert.equal(mttrEndpoint.statusCode, 200);
  assert.equal(mttrEndpoint.body.data[0].mttr_minutes, 44);
  assert.deepEqual(calls.at(-1), ['listReliabilityMttr', { machine_type: 'GRINDER', limit: '3' }]);

  const machineHealthEndpoint = await invoke(router, '/api/maintenance/analytics/machine-health?machine_no=MC-01&limit=3');
  assert.equal(machineHealthEndpoint.statusCode, 200);
  assert.equal(machineHealthEndpoint.body.data[0].health_band, 'healthy');
  assert.deepEqual(calls.at(-1), ['listMachineHealth', { machine_no: 'MC-01', limit: '3' }]);

  const sourceViewAlias = await invoke(router, '/api/maintenance/analytics/machine_health_score?limit=1');
  assert.equal(sourceViewAlias.statusCode, 200);
  assert.deepEqual(calls.at(-1), ['listMachineHealth', { limit: '1' }]);

  const failureRouter = createMaintenanceRouter({
    workorderService: {
      async listWorkorders() {
        throw Object.assign(new Error('relation missing'), { code: '42P01' });
      },
    },
    analyticsService: {},
  });
  const failure = await invoke(failureRouter, '/api/maintenance/workorders');
  assert.equal(failure.statusCode, 503);
  assert.equal(failure.body.error.code, 'DATABASE_SCHEMA_UNAVAILABLE');
}

async function testCors() {
  assert.deepEqual(getAllowedCorsOrigins({}), [
    'http://localhost:5173',
    'http://localhost:5174',
    'http://127.0.0.1:5173',
    'http://127.0.0.1:5174',
  ]);
  assert.deepEqual(getAllowedCorsOrigins({
    MAINTENANCE_API_ALLOWED_ORIGINS: 'http://localhost:5179, http://127.0.0.1:5179',
  }), ['http://localhost:5179', 'http://127.0.0.1:5179']);

  let hitCount = 0;
  const router = createCorsHandler(async (_request, response) => {
    hitCount += 1;
    response.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    response.end(JSON.stringify({ ok: true }));
  });

  const preflight = await invoke(router, '/api/maintenance/workorders', 'OPTIONS', {
    origin: 'http://localhost:5174',
    'access-control-request-headers': 'content-type',
  });
  assert.equal(preflight.statusCode, 204);
  assert.equal(hitCount, 0);
  assert.equal(preflight.headers['Access-Control-Allow-Origin'], 'http://localhost:5174');
  assert.equal(preflight.headers['Access-Control-Allow-Methods'], 'GET, OPTIONS');
  assert.equal(preflight.headers['Access-Control-Allow-Headers'], 'content-type');
  assert.equal(preflight.headers['Access-Control-Max-Age'], '86400');

  const allowed = await invoke(router, '/api/health', 'GET', { origin: 'http://localhost:5174' });
  assert.equal(allowed.statusCode, 200);
  assert.equal(allowed.headers['Access-Control-Allow-Origin'], 'http://localhost:5174');
  assert.equal(allowed.headers['Access-Control-Allow-Methods'], 'GET, OPTIONS');
  assert.deepEqual(allowed.body, { ok: true });

  const disallowed = await invoke(router, '/api/health', 'GET', { origin: 'http://evil.test' });
  assert.equal(disallowed.statusCode, 200);
  assert.notEqual(disallowed.headers['Access-Control-Allow-Origin'], '*');
  assert.equal(disallowed.headers['Access-Control-Allow-Origin'], undefined);

  const wildcardRouter = createCorsHandler(async (_request, response) => {
    response.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    response.end(JSON.stringify({ ok: true }));
  }, { allowedOrigins: ['*'] });
  const wildcard = await invoke(wildcardRouter, '/api/health', 'GET', { origin: 'http://dev-only.test' });
  assert.equal(wildcard.headers['Access-Control-Allow-Origin'], undefined);
}

function testMissingDatabaseUrl() {
  assert.throws(() => assertDatabaseUrl({ DATABASE_URL: '' }), MissingDatabaseUrlError);
}

async function testSmokeScriptHelpAndFailureModes() {
  assert.match(dataSmokeUsageText(), /Usage:/);
  assert.match(apiSmokeUsageText(), /Usage:/);
  assert.throws(() => requireSmokeDatabaseUrl({ DATABASE_URL: '' }), /DATABASE_URL is required/);
  await assert.rejects(() => getJson('http://127.0.0.1:1', '/api/health'), /Request failed/);
}

function testNoCommittedUploads() {
  const result = spawnSync('git', ['ls-files', 'uploads'], {
    cwd: rootDir,
    encoding: 'utf8',
  });
  assert.equal(result.status, 0, result.stderr);
  assert.equal(result.stdout.trim(), '', 'Raw uploads must not be tracked by git.');
}

async function testNoStagingRuntimeReferences() {
  const serverDir = path.join(rootDir, 'src/server');
  const files = await listFiles(serverDir);
  for (const file of files) {
    const source = await readFile(file, 'utf8');
    assert.doesNotMatch(source, /maintenance\.stg_|stg_/i, `Runtime API must not reference staging tables: ${file}`);
  }
}

async function listFiles(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...await listFiles(fullPath));
    } else if (entry.isFile() && fullPath.endsWith('.mjs')) {
      files.push(fullPath);
    }
  }
  return files;
}

function invoke(router, url, method = 'GET', headers = {}) {
  return new Promise((resolve) => {
    const chunks = [];
    const response = {
      statusCode: 0,
      headers: {},
      setHeader(name, value) {
        this.headers[name] = value;
      },
      writeHead(statusCode, headers) {
        this.statusCode = statusCode;
        this.headers = { ...this.headers, ...headers };
      },
      end(chunk) {
        if (chunk) {
          chunks.push(Buffer.from(chunk));
        }
        const rawBody = Buffer.concat(chunks).toString('utf8');
        resolve({
          statusCode: this.statusCode,
          headers: this.headers,
          body: rawBody ? JSON.parse(rawBody) : null,
        });
      },
    };
    router({ method, url, headers }, response);
  });
}
