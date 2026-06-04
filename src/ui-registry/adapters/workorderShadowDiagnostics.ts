import { maintenanceWorkordersSurface } from '../surfaces/maintenanceWorkordersSurface';
import { readonlyActionExecutionPolicy } from '../actions/readonlyActions';
import type { ActionExecutionPolicyMetadata } from '../actions/readonlyActions';
import type { UiValidationResult } from '../types';
import { validateWidgetList } from '../validation';
import {
  adaptWorkorderAgentPayloadToWidgets,
  normalizeWorkorderAgentPayload,
  type WorkorderRuntimeDiagnostic,
  type WorkorderRuntimeRejectedWidget,
  type WorkorderRuntimeTraceMetadata,
} from './workorderAgentPayloadAdapter';

export interface WorkorderReadonlyActionDiagnostics {
  actionId?: string;
  label?: string;
  mode?: string;
  targetId?: string;
  valid: boolean;
  status: 'accepted' | 'rejected';
  rejectionReason?: string;
  executionPolicy: ActionExecutionPolicyMetadata;
}

export interface WorkorderWidgetShadowDiagnostics {
  adaptedWidgetCount: number;
  validationValid: boolean;
  errorCount: number;
  warningCount: number;
  lastPayloadType?: string;
  intent?: string;
  detectedActions: WorkorderReadonlyActionDiagnostics[];
  actionValidationValid: boolean;
  rejectedActionCount: number;
  executionPolicy: ActionExecutionPolicyMetadata;
  runtimeDiagnostics: WorkorderRuntimeDiagnostic[];
  rejectedWidgets: WorkorderRuntimeRejectedWidget[];
  traceMetadata?: WorkorderRuntimeTraceMetadata;
}

export interface WorkorderWidgetShadowDiagnosticsOptions {
  onError?: (error: unknown) => void;
}

export function buildWorkorderWidgetShadowDiagnostics(
  payload: unknown,
  options: WorkorderWidgetShadowDiagnosticsOptions = {},
): WorkorderWidgetShadowDiagnostics {
  const identity = getPayloadIdentity(payload);

  try {
    const normalized = normalizeWorkorderAgentPayload(payload);
    const widgets = adaptWorkorderAgentPayloadToWidgets(payload);
    const validation = validateWidgetList(widgets, maintenanceWorkordersSurface);

    return diagnosticsFromValidation(
      widgets.length,
      validation,
      identity,
      getActionDiagnosticsFromNormalized(normalized),
      getRuntimeDiagnosticsFromNormalized(normalized),
    );
  } catch (error) {
    options.onError?.(error);
    const detectedActions = getActionDiagnostics(payload);
    const rejectedActionCount = detectedActions.filter((action) => !action.valid).length;
    return {
      adaptedWidgetCount: 0,
      validationValid: false,
      errorCount: 1,
      warningCount: 0,
      ...identity,
      detectedActions,
      actionValidationValid: rejectedActionCount === 0,
      rejectedActionCount,
      executionPolicy: readonlyActionExecutionPolicy,
      ...getRuntimeDiagnostics(payload),
    };
  }
}

function diagnosticsFromValidation(
  adaptedWidgetCount: number,
  validation: UiValidationResult,
  identity: Pick<WorkorderWidgetShadowDiagnostics, 'lastPayloadType' | 'intent'>,
  detectedActions: WorkorderReadonlyActionDiagnostics[],
  runtimeDiagnostics: Pick<WorkorderWidgetShadowDiagnostics, 'runtimeDiagnostics' | 'rejectedWidgets' | 'traceMetadata'>,
): WorkorderWidgetShadowDiagnostics {
  const rejectedActionCount = detectedActions.filter((action) => !action.valid).length;

  return {
    adaptedWidgetCount,
    validationValid: validation.valid && rejectedActionCount === 0,
    errorCount: validation.errors.length,
    warningCount: validation.warnings.length,
    ...identity,
    detectedActions,
    actionValidationValid: rejectedActionCount === 0,
    rejectedActionCount,
    executionPolicy: readonlyActionExecutionPolicy,
    ...runtimeDiagnostics,
  };
}

function getRuntimeDiagnostics(payload: unknown): Pick<WorkorderWidgetShadowDiagnostics, 'runtimeDiagnostics' | 'rejectedWidgets' | 'traceMetadata'> {
  try {
    return getRuntimeDiagnosticsFromNormalized(normalizeWorkorderAgentPayload(payload));
  } catch {
    return {
      runtimeDiagnostics: [],
      rejectedWidgets: [],
    };
  }
}

function getRuntimeDiagnosticsFromNormalized(
  normalized: ReturnType<typeof normalizeWorkorderAgentPayload>,
): Pick<WorkorderWidgetShadowDiagnostics, 'runtimeDiagnostics' | 'rejectedWidgets' | 'traceMetadata'> {
  return {
    runtimeDiagnostics: normalized.runtimeDiagnostics,
    rejectedWidgets: normalized.rejectedWidgets,
    traceMetadata: normalized.traceMetadata,
  };
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
