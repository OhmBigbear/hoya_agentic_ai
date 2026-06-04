import { maintenanceWorkordersSurface } from '../surfaces/maintenanceWorkordersSurface';
import { readonlyActionExecutionPolicy } from '../actions/readonlyActions';
import type { UiValidationResult, UiWidget } from '../types';
import { validateWidgetList } from '../validation';
import {
  adaptWorkorderAgentPayloadToWidgets,
  normalizeWorkorderAgentPayload,
} from './workorderAgentPayloadAdapter';
import type {
  WorkorderReadonlyActionDiagnostics,
  WorkorderWidgetShadowDiagnostics,
} from './workorderShadowDiagnostics';

export interface WorkorderWidgetPreviewModel {
  widgets: UiWidget[];
  diagnostics: WorkorderWidgetShadowDiagnostics;
  validation: UiValidationResult;
  safeToRender: boolean;
}

export function buildWorkorderWidgetPreviewModel(payload: unknown): WorkorderWidgetPreviewModel {
  const identity = getPayloadIdentity(payload);

  try {
    const widgets = adaptWorkorderAgentPayloadToWidgets(payload);
    const validation = validateWidgetList(widgets, maintenanceWorkordersSurface);
    const normalized = normalizeWorkorderAgentPayload(payload);
    const detectedActions = getActionDiagnosticsFromNormalized(normalized);
    const rejectedActionCount = detectedActions.filter((action) => !action.valid).length;
    const rejectedWidgetCount = normalized.rejectedWidgets.length;

    return {
      widgets,
      diagnostics: {
        adaptedWidgetCount: widgets.length,
        validationValid: validation.valid && rejectedActionCount === 0 && rejectedWidgetCount === 0,
        errorCount: validation.errors.length,
        warningCount: validation.warnings.length + normalized.runtimeDiagnostics.length,
        detectedActions,
        actionValidationValid: rejectedActionCount === 0,
        rejectedActionCount,
        executionPolicy: readonlyActionExecutionPolicy,
        runtimeDiagnostics: normalized.runtimeDiagnostics,
        rejectedWidgets: normalized.rejectedWidgets,
        traceMetadata: normalized.traceMetadata,
        ...identity,
      },
      validation,
      safeToRender: widgets.length > 0,
    };
  } catch {
    const detectedActions = getActionDiagnostics(payload);
    const validation = {
      valid: false,
      errors: [{ code: 'workorder_widget_preview_failed', message: 'Widget preview could not be built safely' }],
      warnings: [],
    };

    return {
      widgets: [],
      diagnostics: {
        adaptedWidgetCount: 0,
        validationValid: false,
        errorCount: validation.errors.length,
        warningCount: 0,
        detectedActions,
        actionValidationValid: false,
        rejectedActionCount: detectedActions.filter((action) => !action.valid).length,
        executionPolicy: readonlyActionExecutionPolicy,
        ...getRuntimeDiagnostics(payload),
        ...identity,
      },
      validation,
      safeToRender: false,
    };
  }
}

function getActionDiagnostics(payload: unknown): WorkorderReadonlyActionDiagnostics[] {
  try {
    return getActionDiagnosticsFromNormalized(normalizeWorkorderAgentPayload(payload));
  } catch {
    return [];
  }
}

function getActionDiagnosticsFromNormalized(
  normalized: ReturnType<typeof normalizeWorkorderAgentPayload>,
): WorkorderReadonlyActionDiagnostics[] {
  return normalized.actions.map((action) => ({
    actionId: action.actionId,
    label: action.label,
    mode: action.mode,
    targetId: action.targetId,
    valid: action.valid,
    status: action.status,
    rejectionReason: action.rejectionReason,
    executionPolicy: readonlyActionExecutionPolicy,
  }));
}

function getRuntimeDiagnostics(
  payload: unknown,
): Pick<WorkorderWidgetShadowDiagnostics, 'runtimeDiagnostics' | 'rejectedWidgets' | 'traceMetadata'> {
  try {
    const normalized = normalizeWorkorderAgentPayload(payload);
    return {
      runtimeDiagnostics: normalized.runtimeDiagnostics,
      rejectedWidgets: normalized.rejectedWidgets,
      traceMetadata: normalized.traceMetadata,
    };
  } catch {
    return {
      runtimeDiagnostics: [],
      rejectedWidgets: [],
    };
  }
}

function getPayloadIdentity(payload: unknown): Pick<WorkorderWidgetShadowDiagnostics, 'lastPayloadType' | 'intent'> {
  try {
    const normalized = normalizeWorkorderAgentPayload(payload);
    return {
      lastPayloadType: normalized.payloadType,
      intent: normalized.intent,
    };
  } catch {
    const root = getRecord(payload);
    const record = getRecord(root?.workspace_payload) ?? root;

    return {
      lastPayloadType: getText(record?.payload_type),
      intent: getText(record?.intent),
    };
  }
}

function getRecord(value: unknown): Record<string, unknown> | undefined {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return undefined;
  }
  return value as Record<string, unknown>;
}

function getText(value: unknown): string | undefined {
  if (typeof value !== 'string') {
    return undefined;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}
