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
      { id: 'view_workorder', mode: 'readonly', label: 'View WO-100', target: 'WO-100' },
      { id: 'view_machine', mode: 'readonly', label: 'View MACHINE-7A', target: 'MACHINE-7A' },
    ],
    ui_actions: [
      { action_id: 'view_workorder_history', mode: 'readonly', label: 'View history', target: 'WO-100' },
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
      { id: 'view_workorder', mode: 'readonly', label: 'View WO-102', target: 'WO-102' },
      { id: 'view_delay_analysis', mode: 'readonly', label: 'View delay analysis', target: 'MACHINE-7A' },
      { id: 'inspect_unknown', mode: 'readonly', label: 'Unknown readonly action', target: 'WO-102' },
      { id: 'view_machine', mode: 'execute', label: 'Execute machine action', target: 'MACHINE-7A' },
      { id: 'delete_workorder', mode: 'readonly', label: 'Delete WO-102', target: 'WO-102' },
    ],
    ui_actions: [
      { action_id: 'view_bottleneck', mode: 'readonly', label: 'View bottleneck', target: 'MACHINE-7A' },
      { action_id: 'close_workorder', mode: 'readonly', label: 'Close workorder', target: 'WO-102' },
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
      { id: 'bad-action', mode: 'readonly', label: 'Bad action', action_type: 'mutate_database', target: 'writeback' },
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

export const runtimeWorkorderAgentResponse = {
  payload_version: '2.0',
  payload_type: 'workorder_agent_response',
  intent: 'workorder_insight',
  generated_at: '2026-06-05T09:20:00+07:00',
  trace_metadata: {
    trace_id: 'trace-runtime-workorder-021',
    agent_id: 'maint-workorder-agent',
    run_id: 'run-runtime-021-b07',
    payload_version: '2.0',
  },
  summary: {
    title: 'Runtime workorder risk summary',
    headline: 'Agentic Core found repeated open corrective work on POLISHING-7A with spare part risk.',
    confidence: 'high',
    severity: 'warning',
    time_range: { label: 'Last 14 days', from: '2026-05-22', to: '2026-06-05', timezone: 'Asia/Bangkok' },
    limitations: ['Runtime integration is passive and read-only in this UI harness.'],
  },
  widgets: [
    {
      id: 'runtime-open-workorders',
      payload_version: '1.0',
      widget_type: 'workorder_summary',
      title: 'Open runtime workorders',
      summary: 'Runtime workload is concentrated on POLISHING-7A.',
      payload: {
        items: [
          { label: 'Open', value: 7 },
          { label: 'Trend', value: 'up' },
        ],
      },
    },
    {
      id: 'runtime-workorder-table',
      payload_version: '1.0',
      widget_type: 'workorder_table',
      title: 'Runtime workorders',
      payload: {
        rows: [
          { workorder_no: 'WO-RUNTIME-100', equipment_no: 'POLISHING-7A', priority: 'High' },
          { workorder_no: 'WO-RUNTIME-101', equipment_no: 'POLISHING-7A', priority: 'Critical' },
        ],
      },
    },
    {
      id: 'runtime-status-insight',
      payload_version: '1.0',
      widget_type: 'workorder_status_insight',
      title: 'Runtime status insight',
      payload: {
        insights: [
          {
            id: 'runtime-status-open',
            title: 'Open corrective concentration',
            summary: 'Two high-priority runtime workorders are open for POLISHING-7A.',
            severity: 'warning',
            status: 'open',
            equipment_no: 'POLISHING-7A',
          },
        ],
      },
    },
  ],
  readonly_actions: [
    { id: 'view_workorder', mode: 'readonly', label: 'View WO-RUNTIME-100', target: 'WO-RUNTIME-100' },
    { id: 'view_machine', mode: 'readonly', label: 'View POLISHING-7A', target: 'POLISHING-7A' },
    { id: 'view_history', mode: 'readonly', label: 'View history', target: 'WO-RUNTIME-100' },
    { id: 'show_details', mode: 'readonly', label: 'Show details', target: 'WO-RUNTIME-100' },
  ],
  diagnostics: [
    {
      code: 'runtime_payload_normalized',
      severity: 'info',
      section: 'widgets',
      message: 'Runtime widgets were normalized through the maintenance workorder registry.',
    },
  ],
};

export const unsafeRuntimeWorkorderAgentResponse = {
  ...runtimeWorkorderAgentResponse,
  readonly_actions: [
    { id: 'view_workorder', mode: 'readonly', label: 'View WO-RUNTIME-100', target: 'WO-RUNTIME-100' },
    { id: 'delete_workorder', mode: 'readonly', label: 'Delete WO-RUNTIME-100', target: 'WO-RUNTIME-100' },
    { id: 'view_machine', mode: 'execute', label: 'Execute machine action', target: 'POLISHING-7A' },
  ],
};

export const approvalRuntimeWorkorderAgentResponse = {
  ...runtimeWorkorderAgentResponse,
  approval: {
    approval_required: true,
    approval_type: 'maintenance_rca',
    approval_id: 'approval-rca-100',
    task_id: 'task-rca-100',
    approval_status: 'pending',
    approval_reason: 'Human review required before promoting RCA advisory output.',
    approval_review_route: '/approval-inbox?task_id=task-rca-100',
    governance: {
      decision_flow: 'agentic_core_hitl',
    },
    safety: {
      advisory_only: true,
      cmms_writeback_allowed: false,
      workorder_creation_allowed: false,
    },
  },
};

export const agenticCoreWorkspaceRuntimeResponse = {
  assistant_text: 'Agentic Core found open corrective workorders on POLISHING-7A and recommends operator review.',
  trace_id: 'trace-agentic-core-workspace-022',
  generated_by_agent_id: 'workorder-agent',
  confidence: 'high',
  workspace_payload: {
    payload_version: '1.0',
    payload_type: 'workorder_insight',
    intent: 'workorder_insight',
    summary: {
      title: 'Workorder runtime insight',
      headline: 'Open corrective workorders are concentrated on POLISHING-7A with spare-part review recommended.',
      confidence: 'high',
      severity: 'warning',
      time_range: { label: 'Last 14 days' },
      limitations: ['Advisory only until human review is complete.'],
    },
    kpi_cards: [],
    charts: [],
    recommendations: [
      {
        id: 'review-polishing-7a',
        priority: 'high',
        title: 'Review POLISHING-7A corrective queue',
        rationale: 'Three recent corrective workorders reference the same station and may indicate repeat failure risk.',
        suggested_action: 'Inspect the open corrective queue before any CMMS write-back.',
        related_refs: ['agentic-workorder-query'],
      },
    ],
    evidence: [
      {
        source_type: 'tool',
        source_name: 'Agentic Core workorder query',
        reference: 'agentic-workorder-query',
        description: 'Filtered open corrective workorder rows for POLISHING-7A.',
      },
    ],
    filters: {
      equipment_no: 'POLISHING-7A',
      status: 'open',
    },
    debug: {
      normalized_by: 'agentic_core.workorder_agent',
    },
  },
};

export const agenticCoreWorkspaceRuntimeResponseWithApproval = {
  ...agenticCoreWorkspaceRuntimeResponse,
  approval: {
    approval_required: true,
    approval_type: 'maintenance_rca',
    approval_id: 'approval-agentic-core-022',
    task_id: 'task-agentic-core-022',
    approval_status: 'pending',
    approval_reason: 'Review generated RCA advisory before promotion.',
    approval_review_route: '/approval-inbox?task_id=task-agentic-core-022',
  },
};

export const agenticCoreWorkspaceRuntimeResponseV1Alias = {
  ...agenticCoreWorkspaceRuntimeResponse,
  workspace_payload: {
    ...agenticCoreWorkspaceRuntimeResponse.workspace_payload,
    payload_version: 'v1',
  },
};

export const unknownWidgetRuntimeWorkorderAgentResponse = {
  ...runtimeWorkorderAgentResponse,
  widgets: [
    ...runtimeWorkorderAgentResponse.widgets,
    {
      id: 'runtime-unsafe-widget',
      payload_version: '1.0',
      widget_type: 'mutation_form',
      title: 'Unsafe mutation form',
      payload: {},
    },
    {
      id: 'runtime-bad-version',
      payload_version: '9.9',
      widget_type: 'workorder_summary',
      title: 'Bad version',
      payload: { items: [{ label: 'Bad', value: 1 }] },
    },
  ],
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
