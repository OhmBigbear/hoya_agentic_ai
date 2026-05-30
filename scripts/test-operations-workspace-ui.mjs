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
  const contracts = await server.ssrLoadModule('/src/services/operationsWorkspaceContracts.ts');
  const runtime = await server.ssrLoadModule('/src/services/operationsWorkspaceRuntime.ts');
  const copilotApi = await server.ssrLoadModule('/src/services/operationsWorkspaceCopilotApi.ts');
  const page = await server.ssrLoadModule('/src/pages/maintenance/MaintenanceWorkorderTrackingPage.tsx');

  const contractResult = contracts.validateUiActions([
    { type: 'set_filter', target: 'workorder_table', filters: { machine: 'POLISHING-7A' } },
    { type: 'delete_workorder', target: 'maintenance_api', entity_id: 'WO-1' },
    { type: 'open_detail_panel', target: 'workorder_drawer' },
  ]);
  assert.equal(contractResult.valid, false);
  assert.equal(contractResult.accepted_actions.length, 1);
  assert.match(contractResult.errors.join(' '), /writeback action type/);
  assert.match(contractResult.errors.join(' '), /open_detail_panel requires entity_id/);

  const runtimeState = runtime.applyUiActions(runtime.createInitialOperationsWorkspaceState(), [
    { type: 'set_filter', target: 'workorder_table', filters: { status: 'open' } },
    { type: 'focus_chart', target: 'maintenance_frequency_chart' },
    { type: 'set_time_range', target: 'maintenance_dashboard', range: { value: 'last_7_days' } },
    { type: 'highlight_entities', target: 'workorder_table', entity_ids: ['WO-1'] },
    { type: 'sort_table', target: 'workorder_table', sort: { field: 'priority', direction: 'desc' } },
    { type: 'update_workorder', target: 'maintenance_api', entity_id: 'WO-1' },
  ]);
  assert.deepEqual(runtimeState.filters.workorder_table, { status: 'open' });
  assert.equal(runtimeState.focusedChartId, 'maintenance_frequency_chart');
  assert.equal(runtimeState.timeRange, 'last_7_days');
  assert.deepEqual(runtimeState.highlightedEntities.workorder_table, ['WO-1']);
  assert.deepEqual(runtimeState.tableSorts.workorder_table, { field: 'priority', direction: 'desc' });
  assert.equal(runtimeState.appliedActionHistory.at(-1).status, 'rejected');

  const normalized = copilotApi.normalizeOperationsWorkspacePreviewResponse({
    assistant_text: ' Focus maintenance risks. ',
    insights: [
      {
        id: ' insight-1 ',
        type: ' repeat_failure ',
        severity: 'high',
        title: ' Repeated failure detected ',
        summary: ' POLISHING-7A has repeated workorders. ',
      },
    ],
    ui_actions: [
      { type: 'set_filter', target: 'workorder_table', filters: { equipment_no: 'POLISHING-7A' } },
      { type: 'open_detail_panel', target: 'workorder_drawer' },
    ],
    source_tool_ids: ['tool-workorders'],
  });
  assert.equal(normalized.assistant_text, 'Focus maintenance risks.');
  assert.equal(normalized.insights[0].title, 'Repeated failure detected');
  assert.equal(normalized.ui_actions[0].valid, true);
  assert.equal(normalized.ui_actions[1].valid, false);
  assert.match(normalized.ui_actions[1].validation_errors[0], /open_detail_panel requires entity_id/);
  assert.deepEqual(normalized.source_tool_ids, ['tool-workorders']);

  const normalizedWithPayload = copilotApi.normalizeOperationsWorkspacePreviewResponse({
    assistant_text: 'Structured workspace payload ready.',
    insights: normalized.insights,
    ui_actions: normalized.ui_actions,
    trace: { trace_id: 'trace-021' },
    metadata: { response_source: 'agent' },
    workspace_payload: {
      payload_version: '1.0',
      payload_type: 'workorder_insight',
      intent: 'workorder_insight',
      generated_at: '2026-05-30T08:30:00Z',
      summary: {
        title: 'Work Order Risk Summary',
        headline: '18 open work orders found, with 5 requiring attention.',
        confidence: 'medium',
        severity: 'warning',
        limitations: ['Recommendation is based on readonly Work Order records only.'],
      },
      kpi_cards: [
        {
          id: 'open_workorders',
          label: 'Open Work Orders',
          value: 18,
          unit: 'orders',
          trend: 'unknown',
          severity: 'warning',
          description: 'Open work orders in the current selected period.',
        },
      ],
      charts: [
        {
          id: 'status_distribution',
          type: 'table',
          title: 'Status Distribution',
          x_key: 'status',
          y_key: 'count',
          data: [{ status: 'open', count: 18 }],
        },
      ],
      recommendations: [
        {
          id: 'rec_review_aging',
          priority: 'high',
          title: 'Review aging work orders',
          rationale: 'Aging work orders are concentrated in the current view.',
          suggested_action: 'Ask the shift leader to review blockers before handover.',
          requires_human_decision: true,
          related_refs: [],
        },
      ],
      evidence: [
        {
          source_type: 'tool',
          source_name: 'workorder_get_summary',
          description: 'Readonly Work Order summary tool result.',
        },
      ],
    },
  });
  assert.equal(normalizedWithPayload.workspace_payload.summary.title, 'Work Order Risk Summary');
  assert.equal(normalizedWithPayload.workspace_payload.kpi_cards[0].label, 'Open Work Orders');
  assert.equal(normalizedWithPayload.workspace_payload.recommendations[0].title, 'Review aging work orders');
  assert.deepEqual(normalizedWithPayload.trace, { trace_id: 'trace-021' });
  assert.deepEqual(normalizedWithPayload.metadata, { response_source: 'agent' });

  const invalidPayloadResponse = copilotApi.normalizeOperationsWorkspacePreviewResponse({
    assistant_text: 'Chat response still visible.',
    insights: normalized.insights,
    ui_actions: normalized.ui_actions,
    workspace_payload: {
      payload_version: '2.0',
      payload_type: 'workorder_insight',
      intent: 'workorder_insight',
      summary: {
        title: 'Unsupported payload',
        headline: 'This should not render.',
        confidence: 'medium',
        severity: 'warning',
        limitations: [],
      },
    },
  });
  assert.equal(invalidPayloadResponse.workspace_payload, undefined);

  const payloadActions = runtime.buildActionsFromWorkspacePayload({
    ...normalizedWithPayload.workspace_payload,
    filters: { equipment_no: 'POLISHING-7A' },
    actions: [
      {
        id: 'filter-machine',
        label: 'Filter machine',
        action_type: 'apply_filter',
        target: 'workorder_table',
        enabled: true,
      },
    ],
  });
  assert.deepEqual(payloadActions[0], {
    type: 'set_filter',
    target: 'workorder_table',
    filters: { equipment_no: 'POLISHING-7A' },
    action_id: 'filter-machine',
    metadata: { source: 'workspace_payload', label: 'Filter machine' },
  });

  const originalFetch = globalThis.fetch;
  const calls = [];
  globalThis.fetch = async (url, init) => {
    calls.push({ url, init });
    return new Response(JSON.stringify({
      assistant_text: 'Preview ready.',
      insights: [],
      ui_actions: [],
    }), { status: 200, headers: { 'content-type': 'application/json' } });
  };
  await copilotApi.requestOperationsWorkspacePreview({
    message: 'show repeat failures',
    filters: { workorder_table: { machine: 'POLISHING-7A' } },
    limit: 3,
  });
  globalThis.fetch = originalFetch;
  assert.equal(calls[0].url, 'http://agentic-core.test/api/operations-workspace/copilot/preview');
  assert.deepEqual(JSON.parse(calls[0].init.body), {
    message: 'show repeat failures',
    filters: { workorder_table: { machine: 'POLISHING-7A' } },
    limit: 3,
  });

  const previewFilters = page.buildOperationsWorkspacePreviewFilters(
    {
      search: 'bearing',
      status: 'open',
      machine: 'POLISHING-7A',
      workType: 'CM',
      priority: 'High',
      overdueOnly: true,
      waitingPartsOnly: false,
    },
    runtimeState,
    {
      workorder_no: 'WO-1',
      equipment_no: 'POLISHING-7A',
      total_repair_time_hours: 1,
      down_time_hours: 1,
      task_count: 1,
      part_transaction_count: 0,
      issued_qty: 0,
    },
  );
  assert.equal(previewFilters.workorder_table.machine, 'POLISHING-7A');
  assert.equal(previewFilters.time_range, 'last_7_days');
  assert.equal(previewFilters.selected_workorder, 'WO-1');

  const summary = {
    open_workorder_count: 1,
    overdue_workorder_count: 0,
    on_hold_workorder_count: 0,
    completed_workorder_count: 0,
    total_downtime_hours: 0,
    repeat_failure_candidate_count: 1,
    stock_risk_item_count: 0,
    mtbf_mttr: [],
    top_risk_machines: [],
    top_hold_reasons: [],
  };
  const staleTemplateText = 'Maintenance workorder visibility is online';
  const staleFallbackText = 'Recommended next step is to clear overdue and parts-blocked jobs first';
  const countOccurrences = (text, pattern) => (text.match(new RegExp(pattern, 'g')) ?? []).length;

  const initialAssistantMarkup = renderToStaticMarkup(React.createElement(page.MaintenanceAssistantPanel, {
    isOpen: true,
    onClose: () => {},
    messages: [],
    inputMessage: '',
    setInputMessage: () => {},
    onSendMessage: () => {},
    summary,
    workspaceState: runtimeState,
  }));
  assert.match(initialAssistantMarkup, /Quick Insights:/);
  assert.match(initialAssistantMarkup, /Ask for maintenance blockers, repeat failures, parts risk, or actions for the selected workorder/);
  assert.match(initialAssistantMarkup, /data-testid="maintenance-copilot-scroll-area"/);
  assert.match(initialAssistantMarkup, /min-h-0 flex-1 overflow-hidden p-4/);
  assert.doesNotMatch(initialAssistantMarkup, new RegExp(staleTemplateText));
  assert.doesNotMatch(initialAssistantMarkup, new RegExp(staleFallbackText));

  const assistantMarkup = renderToStaticMarkup(React.createElement(page.MaintenanceAssistantPanel, {
    isOpen: true,
    onClose: () => {},
    messages: [
      {
        id: 1,
        role: 'user',
        content: 'Show maintenance risk for POLISHING-7A',
        timestamp: '12:00',
      },
      {
        id: 2,
        role: 'assistant',
        content: 'POLISHING-7A has the highest active maintenance risk.',
        timestamp: '12:00',
        insights: normalized.insights,
        uiActions: normalized.ui_actions,
        actionResults: [
          { action: normalized.ui_actions[0], status: 'applied' },
          { action: normalized.ui_actions[1], status: 'rejected', reason: normalized.ui_actions[1].validation_errors[0] },
        ],
      },
    ],
    inputMessage: '',
    setInputMessage: () => {},
    onSendMessage: () => {},
    summary,
    workspaceState: runtimeState,
  }));
  assert.equal(countOccurrences(assistantMarkup, 'Show maintenance risk for POLISHING-7A'), 1);
  assert.equal(countOccurrences(assistantMarkup, 'POLISHING-7A has the highest active maintenance risk'), 1);
  assert.match(assistantMarkup, /POLISHING-7A has the highest active maintenance risk/);
  assert.match(assistantMarkup, /Repeated failure detected/);
  assert.match(assistantMarkup, /set_filter - workorder_table/);
  assert.match(assistantMarkup, /applied/);
  assert.match(assistantMarkup, /open_detail_panel requires entity_id/);
  assert.match(assistantMarkup, /Time range last_7_days/);
  assert.doesNotMatch(assistantMarkup, new RegExp(staleTemplateText));
  assert.doesNotMatch(assistantMarkup, new RegExp(staleFallbackText));

  const payloadMarkup = renderToStaticMarkup(React.createElement(page.MaintenanceAssistantPanel, {
    isOpen: true,
    onClose: () => {},
    messages: [
      {
        id: 1,
        role: 'assistant',
        content: normalizedWithPayload.assistant_text,
        timestamp: '12:00',
        insights: normalizedWithPayload.insights,
        uiActions: normalizedWithPayload.ui_actions,
        workspacePayload: normalizedWithPayload.workspace_payload,
      },
    ],
    inputMessage: '',
    setInputMessage: () => {},
    onSendMessage: () => {},
    summary,
    workspaceState: runtimeState,
  }));
  assert.match(payloadMarkup, /data-testid="workspace-payload-section"/);
  assert.match(payloadMarkup, /Work Order Risk Summary/);
  assert.match(payloadMarkup, /18 open work orders found/);
  assert.match(payloadMarkup, /Open Work Orders/);
  assert.match(payloadMarkup, /18/);
  assert.match(payloadMarkup, /Status Distribution/);
  assert.match(payloadMarkup, /Review aging work orders/);
  assert.match(payloadMarkup, /Ask the shift leader to review blockers before handover/);
  assert.match(payloadMarkup, /workorder_get_summary/);
  assert.match(payloadMarkup, /Readonly Work Order summary tool result/);
  assert.match(payloadMarkup, /Recommendation is based on readonly Work Order records only/);
  assert.match(payloadMarkup, /Repeated failure detected/);
  assert.match(payloadMarkup, /set_filter - workorder_table/);

  const invalidPayloadMarkup = renderToStaticMarkup(React.createElement(page.MaintenanceAssistantPanel, {
    isOpen: true,
    onClose: () => {},
    messages: [
      {
        id: 1,
        role: 'assistant',
        content: invalidPayloadResponse.assistant_text,
        timestamp: '12:00',
        insights: invalidPayloadResponse.insights,
        uiActions: invalidPayloadResponse.ui_actions,
        workspacePayload: invalidPayloadResponse.workspace_payload,
      },
    ],
    inputMessage: '',
    setInputMessage: () => {},
    onSendMessage: () => {},
    summary,
    workspaceState: runtimeState,
  }));
  assert.match(invalidPayloadMarkup, /Chat response still visible/);
  assert.doesNotMatch(invalidPayloadMarkup, /workspace-payload-section/);
  assert.match(invalidPayloadMarkup, /Repeated failure detected/);
  assert.match(invalidPayloadMarkup, /set_filter - workorder_table/);

  const repeatedPromptMarkup = renderToStaticMarkup(React.createElement(page.MaintenanceAssistantPanel, {
    isOpen: true,
    onClose: () => {},
    messages: [
      { id: 1, role: 'user', content: 'Which machines have repeat failures?', timestamp: '12:00' },
      { id: 2, role: 'assistant', content: 'Preview response 1.', timestamp: '12:00' },
      { id: 3, role: 'user', content: 'Which machines have repeat failures?', timestamp: '12:01' },
      { id: 4, role: 'assistant', content: 'Preview response 2.', timestamp: '12:01' },
    ],
    inputMessage: '',
    setInputMessage: () => {},
    onSendMessage: () => {},
    summary,
    workspaceState: runtimeState,
  }));
  assert.equal(countOccurrences(repeatedPromptMarkup, 'Which machines have repeat failures\\?'), 2);
  assert.equal(countOccurrences(repeatedPromptMarkup, 'Preview response'), 2);
  assert.doesNotMatch(repeatedPromptMarkup, new RegExp(staleTemplateText));
  assert.doesNotMatch(repeatedPromptMarkup, new RegExp(staleFallbackText));
} finally {
  await server.close();
}

console.log('Operations workspace UI tests passed.');
