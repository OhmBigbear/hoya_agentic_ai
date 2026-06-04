import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createServer } from 'vite';

process.env.VITE_APP_MODE = 'mock';
process.env.VITE_AGENTIC_CORE_API_BASE_URL = 'http://agentic-core.test';
process.env.VITE_MAINTENANCE_API_BASE_URL = 'http://maintenance-runtime.test';

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
    filters: {
      search: 'spindle',
      status: 'in_progress',
      machine: 'CURVE-GEN-3B',
      workType: 'CM',
      priority: 'Critical',
      overdueOnly: true,
      waitingPartsOnly: false,
    },
    total: 24,
    page: 1,
    totalPages: 2,
    onFiltersChange: () => {},
    onPageChange: () => {},
    onOpenWorkorder: () => {},
  }));
  assert.match(tableMarkup, /MWO-REAL-001/);
  assert.match(tableMarkup, /Curve generator spindle/);
  assert.match(tableMarkup, /Search workorder, machine, issue/);
  assert.match(tableMarkup, /24 matched/);
  assert.match(tableMarkup, /Showing 1 rows/);
  assert.match(tableMarkup, /Page 2 of 2/);
  assert.match(tableMarkup, /Overdue/);

  const drawerMarkup = renderToStaticMarkup(React.createElement(page.WorkorderDetailDrawer, {
    workorder: workorders[0],
    isOpen: true,
    detail: {
      detail: {
        ...workorders[0],
        equipment: { equipment_no: 'CURVE-GEN-3B', equipment_desc: 'Curve generator spindle' },
        tasks: [{ task_no: '10', description_1: 'Inspect spindle' }],
        parts: [],
        hold_history: [],
      },
      history: [
        { ...workorders[0], workorder_no: 'MWO-REAL-000', status: 'completed' },
        { ...workorders[0], workorder_no: 'MWO-REAL-099', status: 'completed' },
      ],
      parts: [
        { workorder_no: 'MWO-REAL-001', catalogue_no: 'BRG-01', part_name: 'Bearing', issued_qty: 1, movement_qty: 1, transaction_count: 1 },
        { workorder_no: 'MWO-REAL-001', catalogue_no: 'BELT-99', part_name: 'Drive belt', issued_qty: 2, movement_qty: 2, transaction_count: 1 },
      ],
      loading: false,
    },
    onClose: () => {},
  }));
  assert.match(drawerMarkup, /Workorder Detail/);
  assert.match(drawerMarkup, /h-full max-h-full/);
  assert.match(drawerMarkup, /overflow-hidden/);
  assert.match(drawerMarkup, /min-h-0 flex-1 overflow-y-auto/);
  assert.match(drawerMarkup, /aria-label="Workorder detail content"/);
  assert.match(drawerMarkup, /Issue Description/);
  assert.match(drawerMarkup, /Workorder Summary/);
  assert.match(drawerMarkup, /Technician Info/);
  assert.match(drawerMarkup, /Parts Usage/);
  assert.match(drawerMarkup, /Drive belt/);
  assert.match(drawerMarkup, /Maintenance History/);
  assert.match(drawerMarkup, /MWO-REAL-099/);
  assert.match(drawerMarkup, /Downtime Context/);
  assert.match(drawerMarkup, /Operational Notes/);
  assert.match(drawerMarkup, /Close workorder detail/);

  const loadingDrawerMarkup = renderToStaticMarkup(React.createElement(page.WorkorderDetailDrawer, {
    workorder: workorders[0],
    isOpen: true,
    detail: {
      history: [],
      parts: [],
      loading: true,
    },
    onClose: () => {},
  }));
  assert.match(loadingDrawerMarkup, /Loading workorder details/);

  const queryParams = page.buildWorkorderQuery({
    search: 'spindle',
    status: 'in_progress',
    machine: 'CURVE-GEN-3B',
    workType: 'CM',
    priority: 'Critical',
    overdueOnly: true,
    waitingPartsOnly: true,
  }, 2);
  assert.deepEqual(queryParams, {
    q: 'spindle',
    status: 'in_progress',
    equipment_no: 'CURVE-GEN-3B',
    job_type: 'CM',
    priority: 'Critical',
    overdue: true,
    waiting_parts: true,
    limit: 12,
    offset: 24,
  });

  const partialDrawerMarkup = renderToStaticMarkup(React.createElement(page.WorkorderDetailDrawer, {
    workorder: { ...workorders[0], failure_description: undefined, reason: undefined, action_description: undefined },
    isOpen: true,
    detail: {
      detail: undefined,
      history: [],
      parts: [],
      loading: false,
    },
    onClose: () => {},
  }));
  assert.match(partialDrawerMarkup, /No issue description provided by API/);

  const oldShapeTableMarkup = renderToStaticMarkup(React.createElement(page.MaintenanceWorkorderTable, {
    workorders,
    loading: false,
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
  }));
  assert.match(oldShapeTableMarkup, /MWO-REAL-001/);

  const emptyTableMarkup = renderToStaticMarkup(React.createElement(page.MaintenanceWorkorderTable, {
    workorders: [],
    loading: false,
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

  const unavailableMessage = page.buildMaintenanceApiErrorMessage([
    'Maintenance API unavailable at http://maintenance-runtime.test. fetch failed',
    'Maintenance API unavailable at http://maintenance-runtime.test. fetch failed',
  ], 2);
  assert.match(unavailableMessage, /Maintenance API unavailable/);
  assert.match(unavailableMessage, /VITE_MAINTENANCE_API_BASE_URL/);
  assert.doesNotMatch(unavailableMessage, /Agentic Core API client/);
  assert.doesNotMatch(unavailableMessage, /APP_MODE/);
} finally {
  await server.close();
}

console.log('Maintenance workorder UI tests passed.');
