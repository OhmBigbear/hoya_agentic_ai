import { isActionTargetAllowed, isRegionAllowed } from './registry';
import type {
  UiReadonlyActionListWidget,
  UiSurfaceDefinition,
  UiValidationIssue,
  UiValidationResult,
  UiWidget,
  UiWidgetType,
} from './types';

const SUPPORTED_WIDGET_TYPES: ReadonlySet<UiWidgetType> = new Set([
  'kpi_card',
  'summary_card',
  'data_table',
  'trend_chart',
  'insight_list',
  'evidence_list',
  'action_list_readonly',
  'empty_state',
  'error_state',
]);

export function validateWidget(widget: UiWidget, surface?: UiSurfaceDefinition): UiValidationResult {
  const errors: UiValidationIssue[] = [];
  const warnings: UiValidationIssue[] = [];

  if (!isNonEmptyText(widget.id)) {
    errors.push(issue('missing_widget_id', 'Widget id is required', 'id'));
  }

  if (!isSupportedWidgetType(String(widget.type))) {
    errors.push(issue('unsupported_widget_type', `Unsupported widget type '${String(widget.type)}'`, 'type'));
  }

  if (!isNonEmptyText(widget.regionId)) {
    errors.push(issue('missing_region_id', 'Widget regionId is required', 'regionId'));
  } else if (surface && !isRegionAllowed(surface, widget.regionId)) {
    errors.push(issue(
      'region_not_allowed',
      `Widget region '${widget.regionId}' is not allowed on surface '${surface.id}'`,
      'regionId',
    ));
  }

  if (widget.type === 'action_list_readonly') {
    validateReadonlyActions(widget, surface, errors);
  }

  if (widget.type === 'evidence_list' && (!Array.isArray(widget.evidenceRefs) || widget.evidenceRefs.length === 0)) {
    errors.push(issue('missing_evidence_refs', 'evidence_list requires at least one evidence ref', 'evidenceRefs'));
  }

  if (widget.type === 'insight_list' && !hasTraceOrEvidenceMetadata(widget)) {
    warnings.push(issue(
      'missing_insight_metadata',
      'insight_list should include evidence or trace metadata',
      'evidenceRefs',
    ));
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

export function validateWidgetList(widgets: UiWidget[], surface?: UiSurfaceDefinition): UiValidationResult {
  return mergeValidationResults(widgets.map((widget, index) => prefixResultPaths(validateWidget(widget, surface), `widgets[${index}]`)));
}

export function validateSurfaceDefinition(surface: UiSurfaceDefinition): UiValidationResult {
  const errors: UiValidationIssue[] = [];
  const warnings: UiValidationIssue[] = [];

  const duplicateRegionIds = findDuplicateIds(surface.regions.map((region) => region.id));
  duplicateRegionIds.forEach((regionId) => {
    errors.push(issue('duplicate_region_id', `Surface '${surface.id}' has duplicate region id '${regionId}'`, 'regions'));
  });

  const duplicateActionTargetIds = findDuplicateIds(surface.actionTargets?.map((target) => target.id) ?? []);
  duplicateActionTargetIds.forEach((actionTargetId) => {
    errors.push(issue(
      'duplicate_action_target_id',
      `Surface '${surface.id}' has duplicate action target id '${actionTargetId}'`,
      'actionTargets',
    ));
  });

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

export function isSupportedWidgetType(type: string): type is UiWidgetType {
  return SUPPORTED_WIDGET_TYPES.has(type as UiWidgetType);
}

function validateReadonlyActions(
  widget: UiReadonlyActionListWidget,
  surface: UiSurfaceDefinition | undefined,
  errors: UiValidationIssue[],
): void {
  if (!surface) {
    return;
  }

  widget.actions?.forEach((action, index) => {
    if (!isActionTargetAllowed(surface, action.targetId)) {
      errors.push(issue(
        'action_target_not_allowed',
        `Action target '${action.targetId}' is not allowed on surface '${surface.id}'`,
        `actions[${index}].targetId`,
      ));
    }
  });
}

function hasTraceOrEvidenceMetadata(widget: UiWidget): boolean {
  if ((widget.traceRefs?.length ?? 0) > 0 || (widget.evidenceRefs?.length ?? 0) > 0) {
    return true;
  }

  if (widget.type !== 'insight_list') {
    return false;
  }

  return Boolean(widget.insights?.some((insight) => (
    (insight.traceRefs?.length ?? 0) > 0
    || (insight.evidenceRefs?.length ?? 0) > 0
  )));
}

function mergeValidationResults(results: UiValidationResult[]): UiValidationResult {
  const errors = results.flatMap((result) => result.errors);
  const warnings = results.flatMap((result) => result.warnings);

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

function prefixResultPaths(result: UiValidationResult, prefix: string): UiValidationResult {
  return {
    valid: result.valid,
    errors: result.errors.map((item) => prefixIssuePath(item, prefix)),
    warnings: result.warnings.map((item) => prefixIssuePath(item, prefix)),
  };
}

function prefixIssuePath(item: UiValidationIssue, prefix: string): UiValidationIssue {
  return {
    ...item,
    path: item.path ? `${prefix}.${item.path}` : prefix,
  };
}

function findDuplicateIds(ids: string[]): string[] {
  const seen = new Set<string>();
  const duplicates = new Set<string>();

  ids.forEach((id) => {
    if (seen.has(id)) {
      duplicates.add(id);
      return;
    }

    seen.add(id);
  });

  return [...duplicates];
}

function issue(code: string, message: string, path?: string): UiValidationIssue {
  return { code, message, path };
}

function isNonEmptyText(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}
