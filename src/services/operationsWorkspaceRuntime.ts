import type {
  AppliedUiAction,
  CopilotStructuredResponse,
  DashboardStatePatch,
  Insight,
  OperationsWorkspaceState,
  SynchronizedEntityContext,
  SynchronizedTimeRange,
  UiAction,
  UiActionType,
  VisualizationFocusTarget,
} from '../types/operationsWorkspace';
import { isSupportedUiActionType } from './operationsWorkspaceContracts';

const SYNCHRONIZED_TARGETS = new Set([
  'workorder_table',
  'workorder_drawer',
  'maintenance_dashboard',
  'mttr_trend_chart',
  'delay_reasons_chart',
  'maintenance_frequency_chart',
  'maintenance_history_signals',
]);

const CHART_TARGETS = new Set([
  'mttr_trend_chart',
  'delay_reasons_chart',
  'maintenance_frequency_chart',
  'maintenance_history_signals',
]);

export function createInitialOperationsWorkspaceState(): OperationsWorkspaceState {
  return {
    filters: {},
    focusedChartId: null,
    focusedEntity: null,
    highlightedEntities: {},
    openPanel: null,
    timeRange: null,
    selectedMachineId: null,
    selectedWorkorderId: null,
    selectedInsightId: null,
    selectedChartId: null,
    synchronizedEntityContext: null,
    synchronizedTimeRange: null,
    visualizationFocusTarget: null,
    activeInsightIds: [],
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
      nextState = synchronizeVisualizationContext(nextState, {
        source: normalizeSynchronizationSource(action.metadata?.source, 'drawer'),
        targetId: target,
        entityType: String(action.metadata?.entity_type ?? 'workorder'),
        entityId: action.entity_id,
        insightId: getText(action.metadata?.insight_id),
        machineId: getText(action.metadata?.machine_id ?? action.metadata?.equipment_no),
        workorderId: getText(action.metadata?.workorder_id ?? action.metadata?.workorder_no ?? action.entity_id),
      });
      break;
    case 'focus_chart':
      nextState = synchronizeVisualizationContext(
        { ...nextState, focusedChartId: target as string, selectedChartId: target as string },
        {
          source: 'chart',
          targetId: target,
          chartId: target,
          insightId: getText(action.metadata?.insight_id),
          entityIds: normalizeEntityIds(action.entity_ids ?? action.metadata?.entity_ids),
        },
      );
      break;
    case 'set_time_range':
      nextState = synchronizeVisualizationContext(nextState, {
        source: 'time_range',
        targetId: target,
        timeRange: normalizeSynchronizedTimeRange(action.range, action.metadata?.time_range),
      });
      break;
    case 'highlight_entities':
      nextState = synchronizeVisualizationContext({
        ...nextState,
        highlightedEntities: {
          ...nextState.highlightedEntities,
          [target as string]: [...(action.entity_ids ?? [])],
        },
      }, {
        source: 'action',
        targetId: target,
        insightId: getText(action.metadata?.insight_id),
        entityIds: action.entity_ids ?? [],
      });
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

export function synchronizeVisualizationContext(
  state: OperationsWorkspaceState,
  context: {
    source: NonNullable<SynchronizedEntityContext['source']>;
    targetId?: string;
    chartId?: string;
    insightId?: string;
    entityType?: string;
    entityId?: string;
    machineId?: string | null;
    workorderId?: string | null;
    entityIds?: string[];
    timeRange?: SynchronizedTimeRange | null;
  },
): OperationsWorkspaceState {
  const entityContext = deriveEntityContext(state.synchronizedEntityContext, context);
  const activeInsightIds = context.insightId
    ? unique([...(state.activeInsightIds ?? []), context.insightId])
    : [...(state.activeInsightIds ?? [])];
  const chartId = context.chartId ?? (CHART_TARGETS.has(context.targetId ?? '') ? context.targetId : undefined);
  const focusTarget = buildVisualizationFocusState(context, entityContext);
  const highlightedEntities = context.entityIds?.length
    ? synchronizeHighlights(state.highlightedEntities, context.targetId, context.entityIds)
    : cloneHighlightedEntities(state.highlightedEntities);

  return {
    ...state,
    highlightedEntities,
    selectedMachineId: entityContext.machineId,
    selectedWorkorderId: entityContext.workorderId,
    selectedInsightId: context.insightId ?? state.selectedInsightId ?? null,
    selectedChartId: chartId ?? state.selectedChartId ?? null,
    focusedChartId: chartId ?? state.focusedChartId ?? null,
    focusedEntity: entityContext.entityId
      ? { entityType: entityContext.entityType ?? 'entity', entityId: entityContext.entityId }
      : state.focusedEntity,
    synchronizedEntityContext: entityContext,
    synchronizedTimeRange: context.timeRange ?? state.synchronizedTimeRange ?? null,
    timeRange: context.timeRange?.value ?? state.timeRange ?? null,
    visualizationFocusTarget: focusTarget ?? state.visualizationFocusTarget ?? null,
    activeInsightIds,
  };
}

export function deriveEntityContext(
  current: SynchronizedEntityContext | null,
  context: {
    source: NonNullable<SynchronizedEntityContext['source']>;
    insightId?: string;
    entityType?: string;
    entityId?: string;
    machineId?: string | null;
    workorderId?: string | null;
    entityIds?: string[];
  },
): SynchronizedEntityContext {
  const entityIds = normalizeEntityIds(context.entityIds);
  const inferredEntityType = inferEntityType(context.entityId, entityIds);
  const entityType = context.entityType ?? inferredEntityType ?? current?.entityType ?? null;
  const entityId = context.entityId ?? entityIds[0] ?? current?.entityId ?? null;
  const inferredMachineId = inferMachineId(entityType, entityId, entityIds);
  const inferredWorkorderId = inferWorkorderId(entityType, entityId, entityIds);
  const machineId = context.machineId ?? inferredMachineId ?? current?.machineId ?? null;
  const workorderId = context.workorderId ?? inferredWorkorderId ?? current?.workorderId ?? null;

  return {
    machineId,
    workorderId,
    insightId: context.insightId ?? current?.insightId ?? null,
    entityType: entityType ?? null,
    entityId,
    relatedEntityIds: unique([...(current?.relatedEntityIds ?? []), ...entityIds, entityId, machineId, workorderId].filter(isNonEmptyText)),
    source: context.source,
  };
}

export function buildVisualizationFocusState(
  context: {
    source: NonNullable<SynchronizedEntityContext['source']>;
    targetId?: string;
    chartId?: string;
    insightId?: string;
    entityIds?: string[];
  },
  entityContext?: SynchronizedEntityContext | null,
): VisualizationFocusTarget | null {
  const targetId = context.chartId ?? context.targetId ?? context.insightId;
  if (!targetId) {
    return null;
  }

  return {
    targetType: context.chartId || CHART_TARGETS.has(targetId) ? 'chart' : context.source === 'drawer' ? 'drawer' : context.source === 'insight' ? 'insight' : context.source === 'table' ? 'table' : 'dashboard',
    targetId,
    relatedEntityIds: unique([...(context.entityIds ?? []), ...(entityContext?.relatedEntityIds ?? [])]),
  };
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

  if (target && !SYNCHRONIZED_TARGETS.has(target)) {
    return `unknown target '${target}'`;
  }

  if (action.type === 'focus_chart' && target && !CHART_TARGETS.has(target)) {
    return `unknown chart '${target}'`;
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
    highlightedEntities: cloneHighlightedEntities(state.highlightedEntities),
    openPanel: state.openPanel ? { ...state.openPanel } : null,
    timeRange: state.timeRange,
    selectedMachineId: state.selectedMachineId ?? null,
    selectedWorkorderId: state.selectedWorkorderId ?? null,
    selectedInsightId: state.selectedInsightId ?? null,
    selectedChartId: state.selectedChartId ?? null,
    synchronizedEntityContext: state.synchronizedEntityContext
      ? {
          ...state.synchronizedEntityContext,
          relatedEntityIds: [...state.synchronizedEntityContext.relatedEntityIds],
        }
      : null,
    synchronizedTimeRange: state.synchronizedTimeRange ? { ...state.synchronizedTimeRange } : null,
    visualizationFocusTarget: state.visualizationFocusTarget
      ? {
          ...state.visualizationFocusTarget,
          relatedEntityIds: [...state.visualizationFocusTarget.relatedEntityIds],
        }
      : null,
    activeInsightIds: [...(state.activeInsightIds ?? [])],
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

function normalizeSynchronizedTimeRange(range: UiAction['range'], fallback?: unknown): SynchronizedTimeRange | null {
  const value = normalizeTimeRange(range) ?? getText(fallback);
  if (!value) {
    return null;
  }

  return {
    value,
    label: getText(range?.label),
    from: getText(range?.from ?? range?.start),
    to: getText(range?.to ?? range?.end),
  };
}

function synchronizeHighlights(
  highlightedEntities: Record<string, string[]>,
  targetId: string | undefined,
  entityIds: string[],
) {
  const normalized = normalizeEntityIds(entityIds);
  return {
    ...cloneHighlightedEntities(highlightedEntities),
    workorder_table: unique([...(highlightedEntities.workorder_table ?? []), ...normalized]),
    ...(targetId ? { [targetId]: unique([...(highlightedEntities[targetId] ?? []), ...normalized]) } : {}),
  };
}

function cloneHighlightedEntities(highlightedEntities: Record<string, string[]>) {
  return Object.fromEntries(
    Object.entries(highlightedEntities ?? {}).map(([target, entityIds]) => [target, [...entityIds]]),
  );
}

function normalizeEntityIds(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return unique(value.filter(isNonEmptyText).map((entityId) => entityId.trim()));
}

function inferEntityType(entityId: string | undefined, entityIds: string[]): string | null {
  const value = entityId ?? entityIds[0];
  if (!value) {
    return null;
  }
  if (/^wo[-_]/i.test(value)) {
    return 'workorder';
  }
  return 'machine';
}

function inferMachineId(entityType: string | null | undefined, entityId: string | null, entityIds: string[]): string | null {
  if (entityType === 'machine' && entityId) {
    return entityId;
  }
  return entityIds.find((value) => !/^wo[-_]/i.test(value)) ?? null;
}

function inferWorkorderId(entityType: string | null | undefined, entityId: string | null, entityIds: string[]): string | null {
  if (entityType === 'workorder' && entityId) {
    return entityId;
  }
  return entityIds.find((value) => /^wo[-_]/i.test(value)) ?? null;
}

function getText(value: unknown): string | null {
  return isNonEmptyText(value) ? value.trim() : null;
}

function normalizeSynchronizationSource(
  value: unknown,
  fallback: NonNullable<SynchronizedEntityContext['source']>,
): NonNullable<SynchronizedEntityContext['source']> {
  return value === 'table' || value === 'chart' || value === 'drawer' || value === 'insight' || value === 'action' || value === 'time_range'
    ? value
    : fallback;
}

function unique(values: Array<string | null | undefined>): string[] {
  return Array.from(new Set(values.filter(isNonEmptyText).map((value) => value.trim())));
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
