const scriptLikeSummary = '<script>window.__workorderCompatExecuted = true</script>';

export const fullWorkorderAgentPayload = {
  workspace_payload: {
    payload_version: '1.0',
    payload_type: 'workorder_insight',
    intent: 'workorder_insight',
    generated_at: '2026-06-04T10:30:00+07:00',
    summary: {
      title: 'Maintenance risk summary',
      headline: 'Open corrective workorders are concentrated on MACHINE-7A.',
      confidence: 'high',
      severity: 'warning',
      time_range: { label: 'Last 7 days', start: '2026-05-28', end: '2026-06-04' },
      limitations: ['Read-only compatibility preview', 'Human review required before action'],
    },
    kpi_cards: [
      {
        id: 'open-workorders',
        label: 'Open workorders',
        value: 12,
        unit: 'orders',
        trend: 'up',
        severity: 'warning',
        description: 'Open maintenance workorders in the selected scope.',
      },
      {
        id: 'critical-priority',
        label: 'Critical priority',
        value: 3,
        unit: 'orders',
        trend: 'flat',
        severity: 'critical',
      },
    ],
    filters: {
      equipment_no: 'MACHINE-7A',
      status: 'open',
      priority: 'High',
    },
    workorders: [
      {
        workorder_no: 'WO-100',
        equipment_no: 'MACHINE-7A',
        status: 'open',
        priority: 'High',
        work_type: 'Corrective',
        assignee: 'Maintenance team A',
        private_notes: 'Excluded from registry table output',
      },
      {
        workorder_no: 'WO-101',
        equipment_no: 'MACHINE-7A',
        status: 'open',
        priority: 'Critical',
        work_type: 'Inspection',
        technician: 'Technician 12',
      },
    ],
    charts: [
      {
        id: 'downtime-trend',
        type: 'line',
        title: 'Downtime trend',
        description: 'Downtime hours by day for the selected equipment.',
        x_key: 'date',
        y_key: 'hours',
        data: [
          { date: '2026-06-01', hours: 1.5 },
          { date: '2026-06-02', hours: 2 },
          { date: '2026-06-03', hours: 3.25 },
        ],
      },
    ],
    recommendations: [
      {
        id: 'repeat-failure-risk',
        priority: 'high',
        title: 'Repeat failure risk',
        rationale: 'MACHINE-7A has repeated open corrective workorders with rising downtime.',
        suggested_action: 'Review recent bearing repairs before approving any write-back outside this harness.',
        requires_human_decision: true,
        related_refs: ['wo-source', 'downtime-source'],
      },
    ],
    insights: [
      {
        id: 'status-concentration',
        severity: 'medium',
        title: 'Status concentration',
        summary: 'Most open work is still waiting for inspection assignment.',
        suggestedAction: 'Inspect assignment queue.',
        evidence_refs: ['wo-source'],
      },
    ],
    evidence: [
      {
        source_type: 'tool',
        source_name: 'Workorder query',
        reference: 'wo-source',
        timestamp: '2026-06-04T10:29:00+07:00',
        description: 'Open corrective workorders for MACHINE-7A',
      },
    ],
    sources: [
      {
        id: 'downtime-source',
        source: 'maintenance_db',
        summary: 'Downtime history rows',
        href: '/readonly/maintenance/downtime?equipment_no=MACHINE-7A',
      },
    ],
    citations: [
      {
        id: 'policy-source',
        source: 'maintenance_playbook',
        summary: 'Operator review policy',
        href: '/readonly/policies/operator-review',
      },
    ],
    actions: [
      { id: 'preview-wo-100', label: 'Preview WO-100', action_type: 'open_detail', target: 'WO-100', enabled: true },
      { id: 'filter-machine', label: 'Filter MACHINE-7A', action_type: 'apply_filter', target: 'machine', enabled: true },
    ],
    ui_actions: [
      { action_id: 'open-trace', label: 'Open trace', type: 'open_trace', target: 'trace-workorder-agent-1', valid: true },
      { id: 'disabled-filter', label: 'Disabled status filter', action_type: 'apply_filter', target: 'status', enabled: false },
    ],
    trace_id: 'trace-workorder-agent-1',
    action_id: 'agent-action-1',
    generated_by_agent_id: 'maintenance-agent',
    source_tool_ids: ['workorder_query', 'downtime_query'],
  },
};

export const minimalWorkorderAgentPayload = {
  workspace_payload: {
    payload_version: '1.0',
    payload_type: 'workorder_insight',
    intent: 'workorder_insight',
    generated_at: '2026-06-04T10:45:00+07:00',
    summary: {
      title: 'No urgent workorders',
      headline: 'No urgent maintenance workorder preview is available for the selected filters.',
      confidence: 'medium',
      severity: 'normal',
    },
    kpi_cards: [],
    recommendations: [],
    insights: [],
    evidence: [],
    sources: [],
    citations: [],
    actions: [],
    ui_actions: [],
    filters: {},
    workorders: [],
    charts: [],
    trace_id: 'trace-minimal-workorder-agent',
  },
};

export const errorWorkorderAgentPayload = {
  workspace_payload: {
    payload_version: '1.0',
    payload_type: 'workorder_insight',
    intent: 'workorder_insight',
    generated_at: '2026-06-04T10:50:00+07:00',
    error: {
      message: 'Workorder preview is temporarily unavailable.',
      code: 'WORKORDER_PREVIEW_UNAVAILABLE',
    },
    summary: {
      title: 'Error summary should not render',
      headline: 'The adapter should prefer the error state.',
    },
    kpi_cards: [],
    recommendations: [],
    evidence: [],
    actions: [],
    trace_id: 'trace-error-workorder-agent',
  },
};

export const unsupportedActionWorkorderAgentPayload = {
  workspace_payload: {
    payload_version: '1.0',
    payload_type: 'workorder_insight',
    intent: 'workorder_insight',
    generated_at: '2026-06-04T11:00:00+07:00',
    summary: {
      title: 'Action safety summary',
      headline: 'Only read-only action targets should remain after adaptation.',
      confidence: 'high',
      severity: 'normal',
    },
    filters: {
      status: 'open',
    },
    actions: [
      { id: 'preview-wo-102', label: 'Preview WO-102', action_type: 'open_detail', target: 'WO-102', enabled: true },
      { id: 'filter-status', label: 'Filter open status', action_type: 'apply_filter', target: 'status', enabled: true },
      {
        id: 'approve-wo-102',
        label: 'Approve WO-102',
        action_type: 'open_detail',
        target: 'maintenance.workorders.actions.approve_workorder',
        enabled: true,
      },
      { id: 'delete-wo-102', label: 'Delete WO-102', action_type: 'delete_workorder', target: 'WO-102', enabled: true },
    ],
    ui_actions: [
      {
        action_id: 'preview-machine',
        label: 'Preview machine',
        type: 'open_detail_panel',
        targetId: 'maintenance.workorders.actions.preview_machine',
        valid: true,
      },
      {
        action_id: 'writeback-close',
        label: 'Close workorder',
        type: 'close_workorder',
        targetId: 'maintenance.workorders.actions.close_workorder',
        valid: true,
      },
    ],
    recommendations: [],
    evidence: [],
    workorders: [{ workorder_no: 'WO-102', equipment_no: 'MACHINE-7A', status: 'open', priority: 'Medium' }],
    charts: [],
    trace_id: 'trace-unsupported-action-workorder-agent',
  },
};

export const malformedWorkorderAgentPayload = {
  workspace_payload: {
    payload_version: 1,
    payload_type: 'workorder_insight',
    intent: 'workorder_insight',
    generated_at: null,
    summary: {
      title: '',
      headline: null,
      confidence: 'certain',
      severity: 'panic',
    },
    kpi_cards: [
      { id: '', label: 'Missing id', value: 4 },
      { id: 'bad-value', label: 'Bad value', value: { nested: true } },
    ],
    recommendations: [
      { id: 'missing-rationale', title: 'Missing rationale' },
      null,
    ],
    evidence: [
      { source_type: 'unknown', source_name: '' },
      'bad evidence',
    ],
    sources: [
      { id: 'script-source', source: 'agent', summary: scriptLikeSummary, href: 'javascript:alert(1)' },
    ],
    citations: 'bad citations',
    actions: [
      { id: 'bad-action', label: 'Bad action', action_type: 'mutate_database', target: 'writeback', enabled: true },
    ],
    filters: 'bad filters',
    workorders: [
      { raw: { hidden: true } },
      'bad row',
    ],
    charts: [
      { id: 'bad-chart', title: 'Bad chart', type: 'line', data: [{ date: '2026-06-04', hours: 'not numeric' }] },
    ],
    trace_id: '<script>trace</script>',
  },
};

export const htmlInjectionWorkorderAgentPayload = {
  workspace_payload: {
    payload_version: '1.0',
    payload_type: 'workorder_insight',
    intent: 'workorder_insight',
    generated_at: '2026-06-04T11:15:00+07:00',
    summary: {
      title: '<img src=x onerror="window.__workorderCompatExecuted = true">',
      headline: scriptLikeSummary,
      confidence: 'medium',
      severity: 'warning',
    },
    recommendations: [
      {
        id: 'html-like-insight',
        priority: 'high',
        title: '<b>Unsafe-looking insight</b>',
        rationale: 'Treat <script>alert("x")</script> as plain text.',
        suggested_action: 'Render text only.',
        related_refs: [],
      },
    ],
    kpi_cards: [
      { id: 'html-kpi', label: '<svg onload="alert(1)">Open</svg>', value: '<script>1</script>', severity: 'warning' },
    ],
    evidence: [],
    sources: [],
    citations: [],
    actions: [],
    workorders: [
      { workorder_no: '<script>WO-HTML</script>', equipment_no: 'MACHINE-HTML', status: 'open', priority: 'High' },
    ],
    charts: [],
    trace_id: 'trace-html-injection',
  },
};
