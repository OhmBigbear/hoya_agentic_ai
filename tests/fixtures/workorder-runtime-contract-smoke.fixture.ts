export const workorderRuntimeSmokeRequest = {
  query: 'Summarize current maintenance blockers',
  selected_workorder_id: 'WO-SMOKE-100',
  selected_machine_id: 'POLISHING-7A',
  surface_id: 'maintenance.workorders',
  request_source: 'hoya_ui.contract_smoke',
  context: {
    filters: { status: 'open' },
  },
  client_trace_id: 'client-trace-smoke-022',
  payload_version: '1.0',
};

export const workorderRuntimeSmokeResponse = {
  payload_version: '2.0',
  payload_type: 'workorder_agent_response',
  intent: 'workorder_insight',
  trace_metadata: {
    trace_id: 'trace-runtime-smoke-022',
    agent_id: 'maint-workorder-agent',
    run_id: 'run-runtime-smoke-022',
    payload_version: '2.0',
  },
  summary: {
    title: 'Runtime smoke summary',
    headline: 'Open workorders and parts risk were reviewed.',
    confidence: 'high',
    severity: 'info',
  },
  widgets: [],
  readonly_actions: [],
  diagnostics: [],
};

export const workorderRuntimeSmokeErrorResponse = {
  error: {
    error_code: 'agent_unavailable',
    message: 'agent unavailable',
    retryable: true,
    trace_id: 'trace-runtime-smoke-error-022',
    details: { queue_depth: 3 },
  },
};

export const workorderRuntimeSmokeMalformedResponse = {
  message: 'not a runtime payload envelope',
};
