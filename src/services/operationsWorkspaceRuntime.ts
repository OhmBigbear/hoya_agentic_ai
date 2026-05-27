import type {
  AppliedUiAction,
  CopilotStructuredResponse,
  DashboardStatePatch,
  Insight,
  OperationsWorkspaceState,
  UiAction,
  UiActionType,
} from '../types/operationsWorkspace';
import { isSupportedUiActionType } from './operationsWorkspaceContracts';

export function createInitialOperationsWorkspaceState(): OperationsWorkspaceState {
  return {
    filters: {},
    focusedChartId: null,
    focusedEntity: null,
    highlightedEntities: {},
    openPanel: null,
    timeRange: null,
    tableSorts: {},
    appliedActionHistory: [],
  };
}

export function applyUiAction(state: OperationsWorkspaceState, action: UiAction): OperationsWorkspaceState {
  const validationError = validateRuntimeAction(action);
  if (validationError !== null) {
    return appendHistory(state, action, 'rejected', validationError);
  }

  const target = action.target?.trim();
  let nextState = cloneState(state);

  switch (action.type) {
    case 'set_filter':
      nextState = {
        ...nextState,
        filters: {
          ...nextState.filters,
          [target as string]: {
            ...(nextState.filters[target as string] ?? {}),
            ...(action.filters ?? {}),
          },
        },
      };
      break;
    case 'clear_filter':
      nextState = target
        ? { ...nextState, filters: omitKey(nextState.filters, target) }
        : { ...nextState, filters: {} };
      break;
    case 'open_detail_panel':
      nextState = {
        ...nextState,
        focusedEntity: action.entity_id
          ? {
              entityType: String(action.metadata?.entity_type ?? 'entity'),
              entityId: action.entity_id,
            }
          : nextState.focusedEntity,
        openPanel: {
          target: target as string,
          entityId: action.entity_id,
        },
      };
      break;
    case 'focus_chart':
      nextState = { ...nextState, focusedChartId: target as string };
      break;
    case 'set_time_range':
      nextState = { ...nextState, timeRange: normalizeTimeRange(action.range) };
      break;
    case 'highlight_entities':
      nextState = {
        ...nextState,
        highlightedEntities: {
          ...nextState.highlightedEntities,
          [target as string]: [...(action.entity_ids ?? [])],
        },
      };
      break;
    case 'sort_table':
      nextState = {
        ...nextState,
        tableSorts: {
          ...nextState.tableSorts,
          [target as string]: {
            field: action.sort?.field as string,
            direction: action.sort?.direction as 'asc' | 'desc',
          },
        },
      };
      break;
  }

  return appendHistory(nextState, action, 'applied');
}

export function applyUiActions(state: OperationsWorkspaceState, actions: UiAction[]): OperationsWorkspaceState {
  return actions.reduce((currentState, action) => applyUiAction(currentState, action), state);
}

export function normalizeCopilotStructuredResponse(response: Partial<CopilotStructuredResponse>): CopilotStructuredResponse {
  return {
    assistant_text: String(response.assistant_text ?? '').trim(),
    insights: Array.isArray(response.insights) ? response.insights.map(normalizeInsight) : [],
    ui_actions: Array.isArray(response.ui_actions) ? response.ui_actions.map(normalizeAction) : [],
    trace_id: response.trace_id,
    generated_by_agent_id: response.generated_by_agent_id,
    source_tool_ids: response.source_tool_ids ?? [],
    confidence: response.confidence,
    created_at: response.created_at,
  };
}

export function buildDashboardStatePatch(action: UiAction): DashboardStatePatch {
  return {
    ui_actions: [normalizeAction(action)],
    reason: `Apply ${String(action.type)} to dashboard state`,
    trace_id: action.trace_id,
    action_id: action.action_id,
    generated_by_agent_id: action.generated_by_agent_id,
    source_tool_ids: action.source_tool_ids ?? [],
    confidence: action.confidence,
    created_at: action.created_at,
  };
}

function validateRuntimeAction(action: UiAction): string | null {
  if (!isSupportedUiActionType(String(action.type))) {
    return `unknown action type '${String(action.type)}'`;
  }

  if (isWritebackLikeActionType(String(action.type))) {
    return `writeback action type '${String(action.type)}' is not allowed`;
  }

  const target = action.target?.trim();
  if (action.type !== 'clear_filter' && !target) {
    return 'target is required';
  }

  switch (action.type as UiActionType) {
    case 'set_filter':
      return isRecord(action.filters) ? null : 'set_filter requires filters object';
    case 'open_detail_panel':
      return isNonEmptyText(action.entity_id) ? null : 'open_detail_panel requires entity_id';
    case 'highlight_entities':
      return Array.isArray(action.entity_ids) && action.entity_ids.length > 0
        ? null
        : 'highlight_entities requires entity_ids array';
    case 'set_time_range':
      return action.range !== undefined || isNonEmptyText(action.metadata?.time_range)
        ? null
        : 'set_time_range requires range';
    case 'sort_table':
      if (!isRecord(action.sort)) {
        return 'sort_table requires sort field and direction';
      }
      if (!isNonEmptyText(action.sort.field)) {
        return 'sort_table requires sort field';
      }
      if (action.sort.direction !== 'asc' && action.sort.direction !== 'desc') {
        return 'sort_table direction must be asc or desc';
      }
      return null;
    case 'clear_filter':
    case 'focus_chart':
      return null;
    default:
      return `unknown action type '${String(action.type)}'`;
  }
}

function appendHistory(
  state: OperationsWorkspaceState,
  action: UiAction,
  status: AppliedUiAction['status'],
  reason?: string,
): OperationsWorkspaceState {
  return {
    ...state,
    appliedActionHistory: [
      ...state.appliedActionHistory,
      {
        action_id: action.action_id,
        type: String(action.type),
        target: action.target?.trim() || undefined,
        status,
        reason,
        applied_at: new Date().toISOString(),
      },
    ],
  };
}

function cloneState(state: OperationsWorkspaceState): OperationsWorkspaceState {
  return {
    filters: cloneRecordOfRecords(state.filters),
    focusedChartId: state.focusedChartId,
    focusedEntity: state.focusedEntity ? { ...state.focusedEntity } : null,
    highlightedEntities: Object.fromEntries(
      Object.entries(state.highlightedEntities).map(([target, entityIds]) => [target, [...entityIds]]),
    ),
    openPanel: state.openPanel ? { ...state.openPanel } : null,
    timeRange: state.timeRange,
    tableSorts: Object.fromEntries(
      Object.entries(state.tableSorts).map(([target, sort]) => [target, { ...sort }]),
    ),
    appliedActionHistory: state.appliedActionHistory.map((entry) => ({ ...entry })),
  };
}

function normalizeAction(action: UiAction): UiAction {
  return {
    ...action,
    target: action.target?.trim(),
    source_tool_ids: action.source_tool_ids ?? [],
    metadata: action.metadata ?? {},
  };
}

function normalizeInsight(insight: Insight): Insight {
  return {
    ...insight,
    id: insight.id.trim(),
    type: insight.type.trim(),
    title: insight.title.trim(),
    summary: insight.summary.trim(),
    evidence: insight.evidence ?? [],
    related_entities: insight.related_entities ?? [],
    source_tool_ids: insight.source_tool_ids ?? [],
    metadata: insight.metadata ?? {},
  };
}

function normalizeTimeRange(range: UiAction['range']): string | null {
  if (!range) {
    return null;
  }
  const value = range.value ?? range.id ?? range.range ?? range.label;
  if (isNonEmptyText(value)) {
    return value.trim();
  }
  const from = range.from ?? range.start;
  const to = range.to ?? range.end;
  if (isNonEmptyText(from) && isNonEmptyText(to)) {
    return `${from.trim()}/${to.trim()}`;
  }
  return JSON.stringify(range);
}

function omitKey<T>(record: Record<string, T>, key: string): Record<string, T> {
  const next = { ...record };
  delete next[key];
  return next;
}

function cloneRecordOfRecords(record: Record<string, Record<string, unknown>>): Record<string, Record<string, unknown>> {
  return Object.fromEntries(Object.entries(record).map(([key, value]) => [key, { ...value }]));
}

function isWritebackLikeActionType(type: string): boolean {
  return /(^create_|^update_|^delete_|write|approve|commit|mutate)/i.test(type);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isNonEmptyText(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}
