import { AGENTIC_CORE_API_BASE_URL } from '../shared/config/env';
import type {
  Insight,
  OperationsWorkspacePreviewRequest,
  OperationsWorkspacePreviewResponse,
  UiAction,
  UiActionPreview,
} from '../types/operationsWorkspace';
import { validateUiActions } from './operationsWorkspaceContracts';

export async function requestOperationsWorkspacePreview(
  request: OperationsWorkspacePreviewRequest,
): Promise<OperationsWorkspacePreviewResponse> {
  const response = await fetch(buildOperationsWorkspaceUrl('/api/operations-workspace/copilot/preview'), {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      message: request.message,
      filters: request.filters ?? {},
      limit: request.limit ?? 5,
    }),
  });

  const payload = await parseJsonResponse(response);
  return normalizeOperationsWorkspacePreviewResponse(payload);
}

export function buildOperationsWorkspaceUrl(path: string): string {
  const baseUrl = AGENTIC_CORE_API_BASE_URL.trim().replace(/\/+$/, '');
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${baseUrl}${normalizedPath}`;
}

export function normalizeOperationsWorkspacePreviewResponse(payload: unknown): OperationsWorkspacePreviewResponse {
  const record = getRecord(payload);
  const actions = Array.isArray(record.ui_actions) ? record.ui_actions.map(normalizeActionPreview) : [];

  return {
    assistant_text: getString(record.assistant_text).trim(),
    insights: Array.isArray(record.insights) ? record.insights.map(normalizeInsight) : [],
    ui_actions: actions,
    trace_id: getString(record.trace_id) || undefined,
    generated_by_agent_id: getString(record.generated_by_agent_id) || undefined,
    source_tool_ids: getStringArray(record.source_tool_ids),
    confidence: typeof record.confidence === 'number' ? record.confidence : undefined,
    created_at: getString(record.created_at) || undefined,
  };
}

async function parseJsonResponse(response: Response): Promise<unknown> {
  const text = await response.text();
  const payload = text ? safeJsonParse(text) : {};

  if (response.ok) {
    return payload;
  }

  const record = getRecord(payload);
  const message =
    getString(record.message) ||
    getString(record.error) ||
    `Agentic Core preview request failed with ${response.status} ${response.statusText}`;
  throw new Error(message);
}

function normalizeActionPreview(rawAction: unknown): UiActionPreview {
  const record = getRecord(rawAction);
  const action: UiAction = {
    type: getString(record.type),
    target: getString(record.target) || undefined,
    filters: getOptionalRecord(record.filters),
    entity_id: getString(record.entity_id) || undefined,
    entity_ids: getStringArray(record.entity_ids),
    range: getOptionalRecord(record.range),
    sort: normalizeSort(record.sort),
    trace_id: getString(record.trace_id) || undefined,
    action_id: getString(record.action_id) || undefined,
    generated_by_agent_id: getString(record.generated_by_agent_id) || undefined,
    source_tool_ids: getStringArray(record.source_tool_ids),
    confidence: typeof record.confidence === 'number' ? record.confidence : undefined,
    created_at: getString(record.created_at) || undefined,
    metadata: getOptionalRecord(record.metadata) ?? {},
  };
  const validation = validateUiActions([action]);
  return {
    ...action,
    valid: validation.valid,
    validation_errors: validation.errors,
  };
}

function normalizeInsight(rawInsight: unknown): Insight {
  const record = getRecord(rawInsight);
  return {
    id: getString(record.id).trim(),
    type: getString(record.type).trim(),
    severity: normalizeSeverity(record.severity),
    title: getString(record.title).trim(),
    summary: getString(record.summary).trim(),
    evidence: Array.isArray(record.evidence) ? record.evidence.map((item) => getRecord(item)) as Insight['evidence'] : [],
    related_entities: Array.isArray(record.related_entities)
      ? record.related_entities.map((item) => getRecord(item)) as Insight['related_entities']
      : [],
    trace_id: getString(record.trace_id) || undefined,
    generated_by_agent_id: getString(record.generated_by_agent_id) || undefined,
    source_tool_ids: getStringArray(record.source_tool_ids),
    confidence: typeof record.confidence === 'number' ? record.confidence : undefined,
    created_at: getString(record.created_at) || undefined,
    metadata: getOptionalRecord(record.metadata) ?? {},
  };
}

function normalizeSort(value: unknown): UiAction['sort'] {
  const record = getRecord(value);
  if (Object.keys(record).length === 0) {
    return undefined;
  }
  return {
    field: getString(record.field) || undefined,
    direction: getString(record.direction) || undefined,
  };
}

function normalizeSeverity(value: unknown): Insight['severity'] {
  const severity = getString(value);
  if (severity === 'info' || severity === 'low' || severity === 'medium' || severity === 'high' || severity === 'critical') {
    return severity;
  }
  return 'info';
}

function getOptionalRecord(value: unknown): Record<string, unknown> | undefined {
  const record = getRecord(value);
  return Object.keys(record).length > 0 ? record : undefined;
}

function getRecord(value: unknown): Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};
}

function getString(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

function getStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [];
}

function safeJsonParse(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return { message: text };
  }
}
