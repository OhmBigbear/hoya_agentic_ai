import type {
  CopilotStructuredResponse,
  Insight,
  UiAction,
  UiActionType,
  UiActionValidationResult,
} from '../types/operationsWorkspace';

const SUPPORTED_UI_ACTION_TYPES: ReadonlySet<UiActionType> = new Set([
  'set_filter',
  'open_detail_panel',
  'focus_chart',
  'set_time_range',
  'highlight_entities',
  'clear_filter',
  'sort_table',
]);

export function validateUiActions(actions: UiAction[]): UiActionValidationResult {
  const accepted_actions: UiAction[] = [];
  const errors: string[] = [];

  actions.forEach((action, index) => {
    const prefix = `ui_actions[${index}]`;

    if (isWritebackLikeActionType(String(action.type))) {
      errors.push(`${prefix}: writeback action type '${String(action.type)}' is not allowed`);
      return;
    }

    if (!isSupportedUiActionType(String(action.type))) {
      errors.push(`${prefix}: unknown action type '${String(action.type)}'`);
      return;
    }

    if (action.type !== 'clear_filter' && !isNonEmptyText(action.target)) {
      errors.push(`${prefix}: target is required`);
      return;
    }

    const actionErrors = validateActionPayload(action);
    if (actionErrors.length > 0) {
      errors.push(...actionErrors.map((message) => `${prefix}: ${message}`));
      return;
    }

    accepted_actions.push(normalizeAction(action));
  });

  return {
    valid: errors.length === 0,
    accepted_actions,
    errors,
  };
}

export function buildCopilotStructuredResponse(
  assistant_text: string,
  insights: Insight[],
  ui_actions: UiAction[],
): CopilotStructuredResponse {
  const validation = validateUiActions(ui_actions);
  if (!validation.valid) {
    throw new Error(validation.errors.join('; '));
  }

  return {
    assistant_text: assistant_text.trim(),
    insights: insights.map(normalizeInsight),
    ui_actions: validation.accepted_actions,
  };
}

export function isSupportedUiActionType(type: string): type is UiActionType {
  return SUPPORTED_UI_ACTION_TYPES.has(type as UiActionType);
}

function validateActionPayload(action: UiAction): string[] {
  const errors: string[] = [];

  if (action.type === 'set_filter' && !isRecord(action.filters)) {
    errors.push('set_filter requires filters object');
  }

  if (action.type === 'open_detail_panel' && !isNonEmptyText(action.entity_id)) {
    errors.push('open_detail_panel requires entity_id');
  }

  if (action.type === 'highlight_entities' && (!Array.isArray(action.entity_ids) || action.entity_ids.length === 0)) {
    errors.push('highlight_entities requires entity_ids array');
  }

  if (action.type === 'set_time_range' && !isRecord(action.range)) {
    errors.push('set_time_range requires range');
  }

  if (action.type === 'sort_table') {
    if (!isRecord(action.sort)) {
      errors.push('sort_table requires sort field and direction');
    } else {
      if (!isNonEmptyText(action.sort.field)) {
        errors.push('sort_table requires sort field');
      }
      if (action.sort.direction !== 'asc' && action.sort.direction !== 'desc') {
        errors.push('sort_table direction must be asc or desc');
      }
    }
  }

  return errors;
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

function isWritebackLikeActionType(type: string): boolean {
  return /(^create_|^update_|^delete_|write|approve|commit|mutate)/i.test(type);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isNonEmptyText(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}
