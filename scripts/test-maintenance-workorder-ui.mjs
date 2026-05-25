import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createServer } from 'vite';

process.env.VITE_APP_MODE = 'production';
process.env.VITE_AGENTIC_CORE_API_BASE_URL = 'http://agentic-core.test';

const server = await createServer({
  appType: 'custom',
  server: {
    host: '127.0.0.1',
    hmr: false,
    middlewareMode: true,
  },
});

try {
  const page = await server.ssrLoadModule('/src/pages/maintenance/MaintenanceWorkorderTrackingPage.tsx');

  const workorders = [
    {
      workorder_no: 'MWO-REAL-001',
      status: 'in_progress',
      job_type: 'CM',
      priority: 'Critical',
      equipment_no: 'CURVE-GEN-3B',
      equipment_desc: 'Curve generator spindle',
      department: 'Maintenance',
      plan_finish: '2026-05-25T11:30:00Z',
      act_work_start: '2026-05-25T09:00:00Z',
      total_repair_time_hours: 1.5,
      down_time_hours: 1.25,
      failure_description: 'Spindle vibration above threshold',
      task_count: 2,
      part_transaction_count: 1,
      issued_qty: 1,
    },
  ];

  const summary = {
    open_workorder_count: 4,
    overdue_workorder_count: 1,
    on_hold_workorder_count: 2,
    completed_workorder_count: 8,
    total_downtime_hours: 12,
    repeat_failure_candidate_count: 3,
    stock_risk_item_count: 2,
    mtbf_mttr: [{ equipment_no: 'CURVE-GEN-3B', failure_count: 4, mttr_hours: 2.5, total_downtime_hours: 10 }],
    top_risk_machines: [],
    top_hold_reasons: [],
  };

  const kpis = page.buildKpis(summary, workorders, [{ catalogue_no: 'BRG-01', stock_risk: 'below_min' }]);
  const kpiMarkup = renderToStaticMarkup(React.createElement(page.MaintenanceKpiCards, { loading: false, kpis }));
  assert.match(kpiMarkup, /Open Workorders/);
  assert.match(kpiMarkup, /4/);
  assert.match(kpiMarkup, /Avg MTTR/);
  assert.match(kpiMarkup, /2\.5h/);

  const tableMarkup = renderToStaticMarkup(React.createElement(page.MaintenanceWorkorderTable, {
    workorders,
    loading: false,
    expandedRow: 'MWO-REAL-001',
    detailState: {
      'MWO-REAL-001': {
        detail: {
          ...workorders[0],
          equipment: { equipment_no: 'CURVE-GEN-3B', equipment_desc: 'Curve generator spindle' },
          tasks: [{ task_no: '10', description_1: 'Inspect spindle' }],
          parts: [],
          hold_history: [],
        },
        history: [{ ...workorders[0], workorder_no: 'MWO-REAL-000', status: 'completed' }],
        parts: [{ workorder_no: 'MWO-REAL-001', catalogue_no: 'BRG-01', part_name: 'Bearing', issued_qty: 1, movement_qty: 1, transaction_count: 1 }],
        loading: false,
      },
    },
    onToggleRow: () => {},
  }));
  assert.match(tableMarkup, /MWO-REAL-001/);
  assert.match(tableMarkup, /Curve generator spindle/);
  assert.match(tableMarkup, /Issue Description/);
  assert.match(tableMarkup, /Parts Usage/);
  assert.match(tableMarkup, /Maintenance History/);
  assert.match(tableMarkup, /Downtime Context/);

  const emptyTableMarkup = renderToStaticMarkup(React.createElement(page.MaintenanceWorkorderTable, {
    workorders: [],
    loading: false,
    expandedRow: null,
    detailState: {},
    onToggleRow: () => {},
  }));
  assert.match(emptyTableMarkup, /No maintenance workorders returned/);

  const assistantMarkup = renderToStaticMarkup(React.createElement(page.MaintenanceAssistantPanel, {
    isOpen: true,
    onClose: () => {},
    messages: [{ id: 1, role: 'assistant', content: 'Maintenance context ready', timestamp: 'Now' }],
    inputMessage: '',
    setInputMessage: () => {},
    onSendMessage: () => {},
    summary,
    selectedWorkorder: workorders[0],
  }));
  assert.match(assistantMarkup, /AI Operations Copilot/);
  assert.match(assistantMarkup, /Maintenance operational assistant/);
  assert.match(assistantMarkup, /MWO-REAL-001 selected for context/);

  const partialKpis = page.buildKpis({ ...summary, mtbf_mttr: [] }, [{ ...workorders[0], status: undefined, equipment_no: undefined }], []);
  assert.equal(partialKpis[2].value, 'N/A');
  assert.deepEqual(page.buildMttrTrend({ ...summary, mtbf_mttr: [] }), []);
  assert.deepEqual(page.buildFrequencyData([], []), []);
} finally {
  await server.close();
}

console.log('Maintenance workorder UI tests passed.');
