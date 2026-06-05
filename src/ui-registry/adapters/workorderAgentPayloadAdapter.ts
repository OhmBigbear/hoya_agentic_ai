import type {
  WorkspacePayloadChart,
  WorkspacePayloadEvidence,
  WorkspacePayloadKpiCard,
  WorkspacePayloadRecommendation,
  WorkspacePayloadSummary,
} from '../../types/operationsWorkspace';
import type {
  UiEvidenceRef,
  UiReadonlyActionListWidget,
  UiTraceRef,
  UiTrendChartWidget,
  UiWidget,
} from '../types';
import type { AgentReadonlyActionValidation } from '../actions/readonlyActions';
import {
  getAgentReadonlyActionDefinition,
  readonlyActionExecutionPolicy,
  validateAgentReadonlyActions,
} from '../actions/readonlyActions';
import {
  maintenanceWorkordersRegionIds,
  maintenanceWorkordersSurfaceId,
  maintenanceWorkordersSurface,
} from '../surfaces/maintenanceWorkordersSurface';
import { validateWidget } from '../validation';

type WorkorderAgentPayloadRecord = Record<string, unknown>;

export interface WorkorderAgentPayloadAdapterOptions {
  emptyMessage?: string;
}

export interface WorkorderRuntimeTraceMetadata {
  trace_id?: string;
  agent_id?: string;
  run_id?: string;
  payload_version?: string;
}

export interface WorkorderRuntimeDiagnostic {
  code: string;
  message: string;
  severity: 'info' | 'warning' | 'error';
  section?: string;
}

export interface WorkorderRuntimeRejectedWidget {
  widgetId?: string;
  widgetType?: string;
  reason: string;
}

export interface WorkorderAgentRuntimeEnvelope {
  payload_version?: string;
  payload_type?: 'workorder_agent_response' | 'workorder_insight';
  intent?: 'workorder_insight' | string;
  generated_at?: string;
  summary?: unknown;
  widgets?: unknown[];
  readonly_actions?: unknown[];
  diagnostics?: unknown[];
  trace?: WorkorderRuntimeTraceMetadata;
  trace_metadata?: WorkorderRuntimeTraceMetadata;
}

export interface NormalizedWorkorderAgentPayload {
  payloadVersion?: string;
  payloadType?: string;
  intent?: string;
  generatedAt?: string;
  summary?: WorkspacePayloadSummary;
  kpiCards: WorkspacePayloadKpiCard[];
  charts: WorkspacePayloadChart[];
  recommendations: WorkspacePayloadRecommendation[];
  evidence: WorkspacePayloadEvidence[];
  actions: AgentReadonlyActionValidation[];
  filters?: Record<string, unknown>;
  workorderRows: WorkorderTableRow[];
  error?: {
    message: string;
    code?: string;
  };
  runtimeDiagnostics: WorkorderRuntimeDiagnostic[];
  rejectedWidgets: WorkorderRuntimeRejectedWidget[];
  runtimeWidgets: UiWidget[];
  traceMetadata?: WorkorderRuntimeTraceMetadata;
  traceRefs: UiTraceRef[];
  evidenceRefs: UiEvidenceRef[];
}

type WorkorderTableRow = Record<string, string | number | boolean | null>;
type RuntimeWidgetType = 'workorder_summary' | 'workorder_table' | 'workorder_list' | 'workorder_status_insight' | 'workorder_insight';

const regionIds = new Set<string>(maintenanceWorkordersRegionIds);
const supportedRuntimeWidgetPayloadVersion = '1.0';

const kpiSummaryRegion = 'maintenance.workorders.kpi.summary';
const tableRegion = 'maintenance.workorders.table';
const chartRegion = 'maintenance.workorders.charts';
const insightsRegion = 'maintenance.workorders.insights';
const evidenceRegion = 'maintenance.workorders.evidence';
const actionsRegion = 'maintenance.workorders.actions.readonly';

const workorderTableFields = [
  'workorder_no',
  'workorder_id',
  'id',
  'equipment_no',
  'machine_id',
  'machine',
  'status',
  'priority',
  'work_type',
  'assignee',
  'technician',
  'due_date',
  'created_at',
  'updated_at',
] as const;

export function isWorkorderAgentPayloadLike(payload: unknown): payload is WorkorderAgentPayloadRecord {
  const record = getRecord(payload);
  if (!record) {
    return false;
  }

  const candidate = getRecord(record.workspace_payload) ?? record;
  return Boolean(
    candidate.payload_type === 'workorder_insight'
    || candidate.payload_type === 'workorder_agent_response'
    || candidate.intent === 'workorder_insight'
    || candidate.widgets
    || candidate.readonly_actions
    || candidate.diagnostics
    || candidate.trace_metadata
    || candidate.summary
    || candidate.kpi_cards
    || candidate.recommendations
    || candidate.insights
    || candidate.evidence
    || candidate.sources
    || candidate.ui_actions
    || candidate.actions
    || candidate.workorders
    || candidate.workorder_rows
    || candidate.charts
    || candidate.series
    || candidate.error,
  );
}

export function normalizeWorkorderAgentPayload(payload: unknown): NormalizedWorkorderAgentPayload {
  const root = getRecord(payload);
  const record = getRuntimePayloadRecord(root) ?? getRecord(root?.workspace_payload) ?? root;

  if (!record) {
    return emptyNormalizedPayload();
  }

  const error = normalizeError(record.error ?? root?.error ?? record);
  const summary = normalizeSummary(record.summary);
  const runtimeWidgetResult = normalizeRuntimeWidgets(record.widgets);
  const traceMetadata = normalizeTraceMetadata(root, record);
  const evidenceRefs = [
    ...normalizeEvidenceRefs(record.evidence),
    ...normalizeEvidenceRefs(record.sources),
    ...normalizeEvidenceRefs(record.citations),
  ];

  return {
    payloadVersion: getText(record.payload_version),
    payloadType: getText(record.payload_type),
    intent: getText(record.intent),
    generatedAt: getText(record.generated_at),
    summary,
    kpiCards: normalizeArray(record.kpi_cards, normalizeKpiCard),
    charts: [
      ...normalizeArray(record.charts, normalizeChart),
      ...normalizeSeriesCharts(record.series),
    ],
    recommendations: [
      ...normalizeArray(record.recommendations, normalizeRecommendation),
      ...normalizeArray(record.insights, normalizeRecommendation),
    ],
    evidence: normalizeArray(record.evidence, normalizeEvidence),
    actions: validateAgentReadonlyActions([
      ...normalizeRecordArray(record.readonly_actions),
      ...normalizeRecordArray(record.actions),
      ...normalizeRecordArray(record.ui_actions),
    ]),
    filters: getRecord(record.filters) ? { ...getRecord(record.filters) } : undefined,
    workorderRows: normalizeWorkorderRows(record.workorders ?? record.workorder_rows ?? record.rows),
    error,
    runtimeDiagnostics: [
      ...normalizeRuntimeDiagnostics(record.diagnostics),
      ...runtimeWidgetResult.rejectedWidgets.map((widget): WorkorderRuntimeDiagnostic => ({
        code: 'runtime_widget_rejected',
        message: widget.reason,
        severity: 'warning',
        section: widget.widgetId ?? widget.widgetType ?? 'widgets',
      })),
    ],
    rejectedWidgets: runtimeWidgetResult.rejectedWidgets,
    runtimeWidgets: runtimeWidgetResult.widgets,
    traceMetadata,
    traceRefs: normalizeTraceRefs(root ?? record, traceMetadata),
    evidenceRefs,
  };
}

export function adaptWorkorderAgentPayloadToWidgets(
  payload: unknown,
  options: WorkorderAgentPayloadAdapterOptions = {},
): UiWidget[] {
  const normalized = normalizeWorkorderAgentPayload(payload);
  const traceRefs = normalized.traceRefs;
  const evidenceRefs = normalized.evidenceRefs;

  if (normalized.error) {
    return [errorWidget(normalized.error.message, normalized.error.code, traceRefs, evidenceRefs)];
  }

  const widgets: UiWidget[] = [];

  if (normalized.summary) {
    widgets.push({
      id: widgetId('summary'),
      type: 'summary_card',
      regionId: kpiSummaryRegion,
      title: normalized.summary.title,
      summary: normalized.summary.headline,
      items: [
        { label: 'Confidence', value: normalized.summary.confidence },
        { label: 'Severity', value: normalized.summary.severity },
        ...(normalized.summary.time_range?.label
          ? [{ label: 'Time range', value: normalized.summary.time_range.label }]
          : []),
      ],
      traceRefs,
      evidenceRefs,
      metadata: {
        generatedAt: normalized.generatedAt,
        limitations: normalized.summary.limitations,
      },
    });
  }

  normalized.kpiCards.forEach((card, index) => {
    widgets.push({
      id: widgetId(`kpi-${card.id || index}`),
      type: 'kpi_card',
      regionId: kpiSummaryRegion,
      title: card.label,
      description: card.description,
      value: card.value,
      unit: card.unit,
      trend: card.trend === 'unknown' ? undefined : card.trend,
      traceRefs,
      evidenceRefs,
      metadata: { severity: card.severity },
    });
  });

  if (normalized.recommendations.length > 0) {
    widgets.push({
      id: widgetId('insights'),
      type: 'insight_list',
      regionId: insightsRegion,
      title: 'Workorder insights',
      insights: normalized.recommendations.map((item) => ({
        id: safeId(item.id, 'insight'),
        title: item.title,
        summary: item.rationale,
        severity: item.priority,
        evidenceRefs: evidenceRefs.filter((evidence) => item.related_refs.includes(evidence.id)),
        metadata: {
          suggestedAction: item.suggested_action,
          requiresHumanDecision: item.requires_human_decision,
          relatedRefs: item.related_refs,
        },
      })),
      traceRefs,
      evidenceRefs,
    });
  }

  if (evidenceRefs.length > 0) {
    widgets.push({
      id: widgetId('evidence'),
      type: 'evidence_list',
      regionId: evidenceRegion,
      title: 'Evidence',
      evidenceRefs,
      traceRefs,
    });
  }

  const readonlyActions = normalizeReadonlyActions(normalized.actions);
  if (readonlyActions.length > 0) {
    widgets.push({
      id: widgetId('readonly-actions'),
      type: 'action_list_readonly',
      regionId: actionsRegion,
      title: 'Read-only actions',
      actions: readonlyActions,
      traceRefs,
      evidenceRefs,
    });
  }

  if (normalized.workorderRows.length > 0) {
    widgets.push({
      id: widgetId('workorders-table'),
      type: 'data_table',
      regionId: tableRegion,
      title: 'Workorders',
      columns: inferWorkorderColumns(normalized.workorderRows),
      rows: normalized.workorderRows,
      traceRefs,
      evidenceRefs,
    });
  }

  normalized.charts.forEach((chart, index) => {
    const series = normalizeChartSeries(chart);
    if (series.length === 0) {
      return;
    }

    widgets.push({
      id: widgetId(`chart-${chart.id || index}`),
      type: 'trend_chart',
      regionId: chartRegion,
      title: chart.title,
      description: chart.description,
      series,
      traceRefs,
      evidenceRefs,
      metadata: { chartType: chart.type },
    });
  });

  widgets.push(...getRuntimeWidgets(normalized));

  if (widgets.length === 0) {
    widgets.push({
      id: widgetId('empty'),
      type: 'empty_state',
      regionId: kpiSummaryRegion,
      title: 'No workorder preview',
      message: options.emptyMessage ?? 'No maintenance workorder preview data is available.',
      traceRefs,
      evidenceRefs,
    });
  }

  return widgets.filter(isWidgetAllowedForMaintenanceWorkorders);
}

function emptyNormalizedPayload(): NormalizedWorkorderAgentPayload {
  return {
    kpiCards: [],
    charts: [],
    recommendations: [],
    evidence: [],
    actions: [],
    workorderRows: [],
    runtimeDiagnostics: [],
    rejectedWidgets: [],
    runtimeWidgets: [],
    traceRefs: [],
    evidenceRefs: [],
  };
}

function getRuntimePayloadRecord(root: WorkorderAgentPayloadRecord | null | undefined): WorkorderAgentPayloadRecord | null {
  if (!root) {
    return null;
  }

  const nested = getRecord(root.runtime_payload) ?? getRecord(root.agent_response);
  if (nested) {
    return nested;
  }

  if (
    root.payload_type === 'workorder_agent_response'
    || root.widgets
    || root.readonly_actions
    || root.trace_metadata
  ) {
    return root;
  }

  return null;
}

function normalizeRuntimeWidgets(value: unknown): {
  widgets: UiWidget[];
  rejectedWidgets: WorkorderRuntimeRejectedWidget[];
} {
  const widgets: UiWidget[] = [];
  const rejectedWidgets: WorkorderRuntimeRejectedWidget[] = [];

  normalizeRecordArray(value).forEach((record, index) => {
    const widgetIdValue = getText(record.id) ?? `widgets[${index}]`;
    const widgetType = getText(record.widget_type);
    const payloadVersion = getText(record.payload_version);
    const payload = getRecord(record.payload);

    if (!widgetType || !isRuntimeWidgetType(widgetType)) {
      rejectedWidgets.push({
        widgetId: widgetIdValue,
        widgetType,
        reason: `Runtime widget '${widgetIdValue}' uses unsupported widget_type '${widgetType ?? 'unknown'}'`,
      });
      return;
    }

    if (payloadVersion !== supportedRuntimeWidgetPayloadVersion) {
      rejectedWidgets.push({
        widgetId: widgetIdValue,
        widgetType,
        reason: `Runtime widget '${widgetIdValue}' uses unsupported payload_version '${payloadVersion ?? 'missing'}'`,
      });
      return;
    }

    if (!payload) {
      rejectedWidgets.push({
        widgetId: widgetIdValue,
        widgetType,
        reason: `Runtime widget '${widgetIdValue}' is missing object payload`,
      });
      return;
    }

    const candidate = mapRuntimeWidgetContract(record, widgetType, payload, widgetIdValue);
    if (!candidate) {
      rejectedWidgets.push({
        widgetId: widgetIdValue,
        widgetType,
        reason: `Runtime widget '${widgetIdValue}' payload did not match ${widgetType} schema`,
      });
      return;
    }

    const validation = validateWidget(candidate, maintenanceWorkordersSurface);
    if (!validation.valid) {
      rejectedWidgets.push({
        widgetId: widgetIdValue,
        widgetType,
        reason: validation.errors.map((item) => item.message).join('; ') || 'Runtime widget failed validation',
      });
      return;
    }

    if (!isWidgetAllowedForMaintenanceWorkorders(candidate)) {
      rejectedWidgets.push({
        widgetId: widgetIdValue,
        widgetType,
        reason: `Runtime widget '${widgetIdValue}' is not allowed on the maintenance workorders surface`,
      });
      return;
    }

    widgets.push(candidate);
  });

  return { widgets, rejectedWidgets };
}

function mapRuntimeWidgetContract(
  record: WorkorderAgentPayloadRecord,
  widgetType: RuntimeWidgetType,
  payload: WorkorderAgentPayloadRecord,
  widgetIdValue: string,
): UiWidget | null {
  const base = {
    id: safeId(widgetIdValue, `runtime-${widgetType}`),
    title: getText(record.title ?? payload.title),
    description: getText(record.summary ?? payload.summary ?? payload.description),
    metadata: compactRecord({
      runtimeWidgetType: widgetType,
      runtimePayloadVersion: getText(record.payload_version),
      diagnostics: getRecord(record.diagnostics),
      traceMetadata: getRecord(record.trace_metadata ?? record.trace),
    }),
  };

  switch (widgetType) {
    case 'workorder_summary': {
      const summary = getText(payload.headline ?? payload.summary ?? payload.description ?? record.summary);
      const items = normalizeRuntimeSummaryItems(payload.items ?? payload.metrics);
      if (!base.title && !summary && items.length === 0) {
        return null;
      }
      return {
        ...base,
        type: 'summary_card',
        regionId: kpiSummaryRegion,
        title: base.title ?? 'Workorder summary',
        summary,
        items,
      };
    }
    case 'workorder_table':
    case 'workorder_list': {
      const rows = normalizeWorkorderRows(payload.rows ?? payload.workorders ?? payload.items);
      if (rows.length === 0) {
        return null;
      }
      return {
        ...base,
        type: 'data_table',
        regionId: tableRegion,
        title: base.title ?? (widgetType === 'workorder_list' ? 'Workorder list' : 'Workorders'),
        columns: inferWorkorderColumns(rows),
        rows,
      };
    }
    case 'workorder_status_insight':
    case 'workorder_insight': {
      const insights = normalizeRecordArray(payload.insights ?? payload.items).map((item, index) => {
        const id = getText(item.id) ?? `status-insight-${index + 1}`;
        const title = getText(item.title);
        const summary = getText(item.summary ?? item.description ?? item.rationale);
        if (!title || !summary) {
          return null;
        }
        return {
          id: safeId(id, 'status-insight'),
          title,
          summary,
          severity: getText(item.severity ?? item.priority),
          metadata: compactRecord({
            status: getText(item.status),
            workorderNo: getText(item.workorder_no ?? item.workorder_id),
            equipmentNo: getText(item.equipment_no ?? item.machine_id),
          }),
        };
      }).filter((item): item is NonNullable<NonNullable<Extract<UiWidget, { type: 'insight_list' }>['insights']>[number]> => item !== null);

      if (insights.length === 0) {
        const title = getText(payload.title);
        const summary = getText(payload.summary ?? payload.description ?? payload.rationale);
        if (!title || !summary) {
          return null;
        }
        insights.push({
          id: safeId(widgetIdValue, 'status-insight'),
          title,
          summary,
          severity: getText(payload.severity ?? payload.priority),
        });
      }

      return {
        ...base,
        type: 'insight_list',
        regionId: insightsRegion,
        title: base.title ?? 'Workorder status insight',
        insights,
      };
    }
    default:
      return null;
  }
}

function isRuntimeWidgetType(value: string): value is RuntimeWidgetType {
  return value === 'workorder_summary'
    || value === 'workorder_table'
    || value === 'workorder_list'
    || value === 'workorder_status_insight'
    || value === 'workorder_insight';
}

function normalizeRuntimeSummaryItems(value: unknown): NonNullable<Extract<UiWidget, { type: 'summary_card' }>['items']> {
  const fromArray = normalizeRecordArray(value).map((record) => {
    const label = getText(record.label ?? record.name);
    const itemValue = getSummaryItemValue(record.value ?? record.count ?? record.total);
    if (!label || itemValue === undefined) {
      return null;
    }
    return { label, value: itemValue };
  }).filter((item): item is { label: string; value: string | number | null } => item !== null);

  if (fromArray.length > 0) {
    return fromArray;
  }

  const record = getRecord(value);
  if (!record) {
    return [];
  }

  return Object.entries(record).map(([key, itemValue]) => {
    const scalar = getSummaryItemValue(itemValue);
    return scalar === undefined ? null : { label: labelFromField(key), value: scalar };
  }).filter((item): item is { label: string; value: string | number | null } => item !== null);
}

function getSummaryItemValue(value: unknown): string | number | null | undefined {
  const scalar = getScalar(value);
  return typeof scalar === 'boolean' ? undefined : scalar;
}

function getRuntimeWidgets(normalized: NormalizedWorkorderAgentPayload): UiWidget[] {
  if (normalized.runtimeWidgets.length === 0) {
    return [];
  }

  return normalized.runtimeWidgets.map((widget) => ({
    ...widget,
    traceRefs: widget.traceRefs?.length ? widget.traceRefs : normalized.traceRefs,
    evidenceRefs: widget.evidenceRefs?.length ? widget.evidenceRefs : normalized.evidenceRefs,
  } as UiWidget));
}

function normalizeRuntimeDiagnostics(value: unknown): WorkorderRuntimeDiagnostic[] {
  return normalizeRecordArray(value).map((record, index): WorkorderRuntimeDiagnostic => ({
    code: getText(record.code) ?? `runtime_diagnostic_${index + 1}`,
    message: getText(record.message ?? record.description) ?? 'Runtime diagnostic was provided without a message',
    severity: normalizeEnum(record.severity, ['info', 'warning', 'error']) ?? 'info',
    section: getText(record.section),
  }));
}

function normalizeTraceMetadata(
  root: WorkorderAgentPayloadRecord | null | undefined,
  record: WorkorderAgentPayloadRecord,
): WorkorderRuntimeTraceMetadata | undefined {
  const traceRecord = getRecord(record.trace_metadata)
    ?? getRecord(record.trace)
    ?? getRecord(root?.trace_metadata)
    ?? getRecord(root?.trace);

  const trace_id = getText(record.trace_id ?? root?.trace_id ?? traceRecord?.trace_id);
  const agent_id = getText(record.agent_id ?? record.generated_by_agent_id ?? root?.agent_id ?? traceRecord?.agent_id);
  const run_id = getText(record.run_id ?? root?.run_id ?? traceRecord?.run_id);
  const payload_version = getText(record.payload_version ?? root?.payload_version ?? traceRecord?.payload_version);
  const metadata = compactRecord({ trace_id, agent_id, run_id, payload_version }) as WorkorderRuntimeTraceMetadata | undefined;

  return metadata;
}

function normalizeSummary(value: unknown): WorkspacePayloadSummary | undefined {
  const record = getRecord(value);
  const title = getText(record?.title);
  const headline = getText(record?.headline ?? record?.summary ?? record?.description);
  const confidence = normalizeEnum(record?.confidence, ['low', 'medium', 'high']);
  const severity = normalizeEnum(record?.severity, ['normal', 'warning', 'critical', 'unknown']);

  if (!title || !headline) {
    return undefined;
  }

  return {
    title,
    headline,
    confidence: confidence ?? 'medium',
    severity: severity ?? 'unknown',
    time_range: normalizeTimeRange(record?.time_range),
    limitations: normalizeTextArray(record?.limitations),
  };
}

function normalizeKpiCard(value: unknown): WorkspacePayloadKpiCard | null {
  const record = getRecord(value);
  const id = getText(record?.id);
  const label = getText(record?.label ?? record?.title);
  const cardValue = getScalar(record?.value);

  if (!id || !label || cardValue === undefined) {
    return null;
  }

  return {
    id,
    label,
    value: cardValue,
    unit: getText(record?.unit),
    trend: normalizeEnum(record?.trend, ['up', 'down', 'flat', 'unknown']) ?? 'unknown',
    severity: normalizeEnum(record?.severity, ['normal', 'warning', 'critical', 'unknown']) ?? 'unknown',
    description: getText(record?.description),
  };
}

function normalizeChart(value: unknown): WorkspacePayloadChart | null {
  const record = getRecord(value);
  const id = getText(record?.id);
  const title = getText(record?.title ?? record?.label);
  const data = normalizeRecordArray(record?.data ?? record?.points);

  if (!id || !title || data.length === 0) {
    return null;
  }

  return {
    id,
    type: normalizeEnum(record?.type, ['bar', 'line', 'donut', 'table']) ?? 'line',
    title,
    description: getText(record?.description),
    x_key: getText(record?.x_key ?? record?.xField ?? record?.x),
    y_key: getText(record?.y_key ?? record?.yField ?? record?.y),
    data,
  };
}

function normalizeSeriesCharts(value: unknown): WorkspacePayloadChart[] {
  return normalizeRecordArray(value).map((series, index) => ({
    id: getText(series.id) ?? `series-${index + 1}`,
    type: 'line',
    title: getText(series.title ?? series.label) ?? `Series ${index + 1}`,
    x_key: getText(series.x_key) ?? 'x',
    y_key: getText(series.y_key) ?? 'y',
    data: normalizeRecordArray(series.points ?? series.data),
  })).filter((chart) => chart.data.length > 0);
}

function normalizeRecommendation(value: unknown): WorkspacePayloadRecommendation | null {
  const record = getRecord(value);
  const id = getText(record?.id);
  const title = getText(record?.title);
  const rationale = getText(record?.rationale ?? record?.summary ?? record?.description);

  if (!id || !title || !rationale) {
    return null;
  }

  return {
    id,
    title,
    rationale,
    priority: normalizeEnum(record?.priority ?? record?.severity, ['low', 'medium', 'high']) ?? 'medium',
    suggested_action: getText(record?.suggested_action ?? record?.suggestedAction) ?? '',
    requires_human_decision: true,
    related_refs: normalizeTextArray(record?.related_refs ?? record?.evidence_refs),
  };
}

function normalizeEvidence(value: unknown): WorkspacePayloadEvidence | null {
  const record = getRecord(value);
  const sourceType = normalizeEnum(record?.source_type ?? record?.sourceType, ['tool', 'api', 'dataset', 'agent', 'system']);
  const sourceName = getText(record?.source_name ?? record?.source ?? record?.label);

  if (!sourceType || !sourceName) {
    return null;
  }

  return {
    source_type: sourceType,
    source_name: sourceName,
    reference: getText(record?.reference ?? record?.id ?? record?.href),
    timestamp: getText(record?.timestamp),
    description: getText(record?.description ?? record?.summary),
  };
}

function normalizeEvidenceRefs(value: unknown): UiEvidenceRef[] {
  return normalizeRecordArray(value).map((record, index): UiEvidenceRef | null => {
    const id = getText(record.id ?? record.reference ?? record.source_tool_id) ?? `evidence-${index + 1}`;
    const label = getText(record.label ?? record.source_name ?? record.source ?? record.summary ?? record.description) ?? id;
    return {
      id: safeId(id, 'evidence'),
      label,
      source: getText(record.source_type ?? record.source),
      href: getText(record.href ?? record.reference),
      metadata: compactRecord({
        timestamp: getText(record.timestamp),
        description: getText(record.description ?? record.summary),
        sourceToolId: getText(record.source_tool_id),
      }),
    };
  }).filter((item): item is UiEvidenceRef => item !== null);
}

function normalizeReadonlyActions(
  actions: AgentReadonlyActionValidation[],
): NonNullable<UiReadonlyActionListWidget['actions']> {
  return actions
    .filter((action) => action.valid && action.action && action.targetId)
    .map((action) => {
      const readonlyAction = action.action;
      const definition = getAgentReadonlyActionDefinition(readonlyAction.id);
      return {
        id: safeId(readonlyAction.id, 'action'),
        label: readonlyAction.label ?? definition.label,
        targetId: action.targetId!,
        metadata: compactRecord({
          actionId: readonlyAction.id,
          mode: readonlyAction.mode,
          executionPolicy: readonlyActionExecutionPolicy,
          navigation: definition.navigation,
          target: readonlyAction.target,
        }),
      };
    })
}

function normalizeWorkorderRows(value: unknown): WorkorderTableRow[] {
  return normalizeRecordArray(value).map((record) => {
    const row: WorkorderTableRow = {};
    workorderTableFields.forEach((field) => {
      const scalar = getScalar(record[field]);
      if (scalar !== undefined) {
        row[field] = scalar;
      }
    });
    return row;
  }).filter((row) => Object.keys(row).length > 0);
}

function inferWorkorderColumns(rows: WorkorderTableRow[]): Array<{ id: string; label: string; field: string }> {
  const fields = workorderTableFields.filter((field) => rows.some((row) => row[field] !== undefined));
  return fields.map((field) => ({
    id: field,
    label: labelFromField(field),
    field,
  }));
}

function normalizeChartSeries(chart: WorkspacePayloadChart): UiTrendChartWidget['series'] {
  const xKey = chart.x_key ?? inferChartKey(chart.data, ['x', 'date', 'day', 'period', 'label', 'timestamp']);
  const yKey = chart.y_key ?? inferChartKey(chart.data, ['y', 'value', 'count', 'total', 'hours']);

  if (!xKey || !yKey) {
    return [];
  }

  return [{
    id: safeId(chart.id, 'series'),
    label: chart.title,
    points: chart.data.map((point, index) => ({
      x: getScalar(point[xKey]) ?? index + 1,
      y: getNumber(point[yKey]),
    })),
  }];
}

function inferChartKey(rows: Record<string, unknown>[], preferred: string[]): string | undefined {
  const keys = rows.flatMap((row) => Object.keys(row));
  return preferred.find((key) => keys.includes(key)) ?? keys[0];
}

function normalizeError(value: unknown): NormalizedWorkorderAgentPayload['error'] {
  if (typeof value === 'string' && value.trim().length > 0) {
    return { message: value.trim() };
  }

  const record = getRecord(value);
  if (!record) {
    return undefined;
  }

  const message = getText(record.message ?? record.error_message);
  const code = getText(record.code ?? record.errorCode ?? record.error_code);
  if (message && (record.error || record.status === 'error' || record.ok === false || code)) {
    return { message, code };
  }

  return undefined;
}

function errorWidget(
  message: string,
  code: string | undefined,
  traceRefs: UiTraceRef[],
  evidenceRefs: UiEvidenceRef[],
): UiWidget {
  return {
    id: widgetId('error'),
    type: 'error_state',
    regionId: kpiSummaryRegion,
    title: 'Unable to adapt workorder preview',
    message,
    errorCode: code,
    traceRefs,
    evidenceRefs,
  };
}

function normalizeTraceRefs(
  record: WorkorderAgentPayloadRecord,
  traceMetadata?: WorkorderRuntimeTraceMetadata,
): UiTraceRef[] {
  const traceId = traceMetadata?.trace_id ?? getText(record.trace_id ?? getRecord(record.trace)?.trace_id);
  const actionId = getText(record.action_id);
  const generatedByAgentId = traceMetadata?.agent_id ?? getText(record.generated_by_agent_id);
  const sourceToolIds = normalizeTextArray(record.source_tool_ids);
  const refs: UiTraceRef[] = [];

  if (traceId || generatedByAgentId || traceMetadata?.run_id || traceMetadata?.payload_version) {
    refs.push({
      id: safeId(traceId ?? traceMetadata?.run_id ?? generatedByAgentId ?? 'runtime-trace', 'trace'),
      label: 'Agent trace',
      source: 'agent',
      metadata: compactRecord({
        traceId,
        actionId,
        generatedByAgentId,
        runId: traceMetadata?.run_id,
        payloadVersion: traceMetadata?.payload_version,
      }),
    });
  }

  sourceToolIds.forEach((sourceToolId) => {
    refs.push({
      id: safeId(sourceToolId, 'tool'),
      label: sourceToolId,
      source: 'tool',
    });
  });

  return refs;
}

function isWidgetAllowedForMaintenanceWorkorders(widget: UiWidget): boolean {
  return regionIds.has(widget.regionId) && isWidgetTypeAllowedInRegion(widget.type, widget.regionId);
}

function isWidgetTypeAllowedInRegion(type: UiWidget['type'], regionId: string): boolean {
  switch (regionId) {
    case kpiSummaryRegion:
      return type === 'kpi_card' || type === 'summary_card' || type === 'empty_state' || type === 'error_state';
    case tableRegion:
      return type === 'data_table' || type === 'empty_state' || type === 'error_state';
    case chartRegion:
      return type === 'trend_chart' || type === 'summary_card' || type === 'empty_state' || type === 'error_state';
    case insightsRegion:
      return type === 'insight_list' || type === 'empty_state' || type === 'error_state';
    case evidenceRegion:
      return type === 'evidence_list' || type === 'empty_state' || type === 'error_state';
    case actionsRegion:
      return type === 'action_list_readonly' || type === 'empty_state' || type === 'error_state';
    default:
      return false;
  }
}

function normalizeTimeRange(value: unknown): WorkspacePayloadSummary['time_range'] {
  const record = getRecord(value);
  if (!record) {
    return null;
  }
  return {
    from: getText(record.from),
    to: getText(record.to),
    timezone: getText(record.timezone),
    label: getText(record.label),
  };
}

function normalizeArray<T>(value: unknown, normalize: (item: unknown) => T | null): T[] {
  return Array.isArray(value) ? value.map(normalize).filter((item): item is T => item !== null) : [];
}

function normalizeRecordArray(value: unknown): Record<string, unknown>[] {
  return Array.isArray(value) ? value.map(getRecord).filter((item): item is Record<string, unknown> => item !== null) : [];
}

function getRecord(value: unknown): WorkorderAgentPayloadRecord | null {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
    ? value as WorkorderAgentPayloadRecord
    : null;
}

function getText(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : undefined;
}

function getScalar(value: unknown): string | number | boolean | null | undefined {
  if (typeof value === 'string') {
    return value.trim();
  }
  if (typeof value === 'number' || typeof value === 'boolean' || value === null) {
    return value;
  }
  return undefined;
}

function getNumber(value: unknown): number | null {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : null;
  }
  if (typeof value === 'string' && value.trim().length > 0) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function normalizeTextArray(value: unknown): string[] {
  return Array.isArray(value) ? value.map(getText).filter((item): item is string => Boolean(item)) : [];
}

function normalizeEnum<T extends string>(value: unknown, allowed: readonly T[]): T | undefined {
  return typeof value === 'string' && allowed.includes(value as T) ? value as T : undefined;
}

function compactRecord(record: Record<string, unknown>): Record<string, unknown> | undefined {
  const compacted = Object.fromEntries(Object.entries(record).filter(([, value]) => value !== undefined));
  return Object.keys(compacted).length > 0 ? compacted : undefined;
}

function safeId(value: string, fallbackPrefix: string): string {
  const normalized = value.trim().toLowerCase().replace(/[^a-z0-9._:-]+/g, '-').replace(/^-+|-+$/g, '');
  return normalized || fallbackPrefix;
}

function widgetId(suffix: string): string {
  return `${maintenanceWorkordersSurfaceId}.adapter.${safeId(suffix, 'widget')}`;
}

function labelFromField(field: string): string {
  return field.split('_').map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(' ');
}
