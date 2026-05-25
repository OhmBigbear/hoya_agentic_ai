import assert from 'node:assert/strict';
import { createServer } from 'vite';

process.env.VITE_APP_MODE = 'production';
process.env.VITE_AGENTIC_CORE_API_BASE_URL = 'http://agentic-core.test';

const fetchCalls = [];
globalThis.fetch = async (url, init = {}) => {
  fetchCalls.push({ url: String(url), init });
  const requestUrl = new URL(String(url));

  if (requestUrl.pathname === '/api/maintenance/workorders') {
    assert.equal(requestUrl.searchParams.get('site'), 'HOYA-BKK');
    assert.equal(requestUrl.searchParams.get('status'), 'OPEN');
    assert.equal(requestUrl.searchParams.get('limit'), '25');
    return jsonResponse({
      data: [{
        work_order_id: 'wo-id-1',
        workorder_no: 'WO-1001',
        status: 'OPEN',
        equipment_no: 'MC-01',
        total_repair_time_hours: null,
        down_time_hours: '2.5',
        task_count: null,
        part_transaction_count: '3',
        issued_qty: '4',
      }],
      total: 1,
      trace_id: 'trace-workorders',
    });
  }

  if (requestUrl.pathname === '/api/maintenance/workorders/WO-1001') {
    return jsonResponse({
      data: {
        workorder_no: 'WO-1001',
        status: 'CLOSED',
        equipment_no: 'MC-01',
        equipment: {
          equipment_no: 'MC-01',
          equipment_desc: 'Generator 1',
          is_active: true,
        },
        tasks: [{ task_no: '10', description_1: 'Inspect bearing' }],
        parts: [{ workorder_no: 'WO-1001', catalogue_no: 'BRG-01', issued_qty: null, movement_qty: '2', transaction_count: '1' }],
        hold_history: [{ hold_reason_description: 'Waiting part', hold_count: '1' }],
      },
    });
  }

  if (requestUrl.pathname === '/api/maintenance/equipment/MC-01/history') {
    assert.equal(requestUrl.searchParams.get('from'), '2026-01-01');
    return jsonResponse({
      rows: [{ workorder_no: 'WO-0999', equipment_no: 'MC-01', down_time_hours: 1 }],
    });
  }

  if (requestUrl.pathname === '/api/maintenance/analytics/mtbf-mttr') {
    return jsonResponse({
      items: [{ equipment_no: 'MC-01', workorder_count: '4', mtbf_hours: '12.5', mttr_hours: null, total_downtime_hours: '8' }],
    });
  }

  if (requestUrl.pathname === '/api/maintenance/workorders/WO-1001/parts') {
    return jsonResponse([{ workorder_no: 'WO-1001', catalogue_no: 'BRG-01', issued_qty: '1', movement_qty: '1', transaction_count: '1' }]);
  }

  if (requestUrl.pathname === '/api/maintenance/analytics/hold-reasons') {
    return jsonResponse({ data: [{ hold_reason_description: 'Waiting part', hold_count: '2', affected_workorder_count: null }] });
  }

  if (requestUrl.pathname === '/api/maintenance/analytics/repeat-failures') {
    return jsonResponse({ data: [{ equipment_no: 'MC-01', failure_signal: 'Bearing noise', workorder_count: '2', workorders: ['WO-1001', 'WO-0999'] }] });
  }

  if (requestUrl.pathname === '/api/maintenance/analytics/stock-risk') {
    return jsonResponse({ data: [{ catalogue_no: 'BRG-01', part_name: 'Bearing', stock_risk: 'below_min', on_hand: '0' }] });
  }

  if (requestUrl.pathname === '/api/maintenance/dashboard-summary') {
    return jsonResponse({
      data: {
        open_workorder_count: '5',
        overdue_workorder_count: null,
        on_hold_workorder_count: '1',
        completed_workorder_count: '9',
        total_downtime_hours: '14.25',
        repeat_failure_candidate_count: '2',
        stock_risk_item_count: '3',
        mtbf_mttr: [{ equipment_no: 'MC-01', failure_count: '2', total_downtime_hours: '3' }],
        top_risk_machines: [{ equipment_no: 'MC-01', workorder_count: '2' }],
        top_hold_reasons: [{ hold_reason_description: 'Waiting part', hold_count: '2' }],
      },
    });
  }

  if (requestUrl.pathname === '/api/maintenance/analytics/error') {
    return new Response('Database view unavailable', { status: 503, statusText: 'Service Unavailable' });
  }

  return new Response('Not found', { status: 404, statusText: 'Not Found' });
};

const server = await createServer({
  appType: 'custom',
  server: {
    host: '127.0.0.1',
    hmr: false,
    middlewareMode: true,
  },
});

try {
  const api = await server.ssrLoadModule('/src/services/maintenanceWorkorderApi.ts');
  const workorders = await api.getWorkorderTracking({ site: 'HOYA-BKK', status: 'OPEN', limit: 25 });
  const detail = await api.getWorkorderDetail('WO-1001');
  const history = await api.getMachineMaintenanceHistory('MC-01', { from: '2026-01-01' });
  const mtbf = await api.getMtbfMttrSummary();
  const parts = await api.getSparePartUsageByWorkorder('WO-1001');
  const holds = await api.getHoldReasonSummary();
  const repeats = await api.getRepeatFailureCandidates();
  const stock = await api.getStockRiskSummary();
  const dashboard = await api.getMaintenanceDashboardSummary();

  assert.equal(fetchCalls[0].url, 'http://agentic-core.test/api/maintenance/workorders?site=HOYA-BKK&status=OPEN&limit=25');
  assert.equal(workorders.trace_id, 'trace-workorders');
  assert.equal(workorders.total, 1);
  assert.equal(workorders.data[0].total_repair_time_hours, 0);
  assert.equal(workorders.data[0].down_time_hours, 2.5);
  assert.equal(workorders.data[0].task_count, 0);
  assert.equal(workorders.data[0].part_transaction_count, 3);
  assert.equal(workorders.data[0].issued_qty, 4);

  assert.equal(detail.data.equipment?.equipment_desc, 'Generator 1');
  assert.equal(detail.data.tasks[0].description_1, 'Inspect bearing');
  assert.equal(detail.data.parts[0].issued_qty, 0);
  assert.equal(detail.data.parts[0].movement_qty, 2);
  assert.equal(detail.data.hold_history[0].hold_count, 1);

  assert.equal(history.data[0].workorder_no, 'WO-0999');
  assert.equal(mtbf.data[0].failure_count, 4);
  assert.equal(mtbf.data[0].mtbf_hours, 12.5);
  assert.equal(parts.data[0].transaction_count, 1);
  assert.equal(holds.data[0].affected_workorder_count, undefined);
  assert.deepEqual(repeats.data[0].workorders, ['WO-1001', 'WO-0999']);
  assert.equal(stock.data[0].on_hand, 0);
  assert.equal(dashboard.data.open_workorder_count, 5);
  assert.equal(dashboard.data.overdue_workorder_count, 0);
  assert.equal(dashboard.data.mtbf_mttr[0].failure_count, 2);

  assert.deepEqual(api.toMaintenanceQueryParams({
    site: 'HOYA-BKK',
    equipment_no: 'MC-01',
    status: 'OPEN',
    from: '2026-01-01',
    to: undefined,
    limit: 10,
  }), {
    site: 'HOYA-BKK',
    equipment_no: 'MC-01',
    status: 'OPEN',
    from: '2026-01-01',
    limit: 10,
  });

  assert.throws(() => api.getWorkorderDetail(''), /workorderNo is required/);

  const { agenticCoreClient } = await server.ssrLoadModule('/src/shared/api/agenticCoreClient.ts');
  await assert.rejects(
    () => agenticCoreClient.get('/api/maintenance/analytics/error'),
    /Agentic Core API request failed with 503 Service Unavailable: Database view unavailable/,
  );

  const queryScript = await import('./maintenance/query-maintenance.mjs');
  const helpResult = queryScript.runCommand(['--help']);
  assert.equal(helpResult.status, 0);
  assert.match(helpResult.stdout, /Queries only maintenance agent-ready views/);

  const dryRunResult = queryScript.runCommand([
    'workorders',
    '--site',
    'HOYA-BKK',
    '--limit',
    '5',
    '--dry-run',
  ]);
  assert.equal(dryRunResult.status, 0);
  assert.match(dryRunResult.stdout, /maintenance\.v_workorder_tracking/);
  assert.match(dryRunResult.stdout, /WHERE site = 'HOYA-BKK'/);
  assert.match(dryRunResult.stdout, /LIMIT 5/);

  const missingDb = queryScript.runCommand(['workorders'], { DATABASE_URL: '' });
  assert.equal(missingDb.status, 1);
  assert.match(missingDb.stderr, /DATABASE_URL is required/);
} finally {
  await server.close();
}

function jsonResponse(body) {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}

console.log('Maintenance workorder API tests passed.');
