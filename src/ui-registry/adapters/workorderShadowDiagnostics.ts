import { maintenanceWorkordersSurface } from '../surfaces/maintenanceWorkordersSurface';
import type { UiValidationResult } from '../types';
import { validateWidgetList } from '../validation';
import {
  adaptWorkorderAgentPayloadToWidgets,
  normalizeWorkorderAgentPayload,
} from './workorderAgentPayloadAdapter';

export interface WorkorderReadonlyActionDiagnostics {
  actionId?: string;
  label?: string;
  mode?: string;
  targetId?: string;
  valid: boolean;
  status: 'accepted' | 'rejected';
  rejectionReason?: string;
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
    const widgets = adaptWorkorderAgentPayloadToWidgets(payload);
    const validation = validateWidgetList(widgets, maintenanceWorkordersSurface);

    return diagnosticsFromValidation(widgets.length, validation, identity, getActionDiagnostics(payload));
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
    };
  }
}

function diagnosticsFromValidation(
  adaptedWidgetCount: number,
  validation: UiValidationResult,
  identity: Pick<WorkorderWidgetShadowDiagnostics, 'lastPayloadType' | 'intent'>,
  detectedActions: WorkorderReadonlyActionDiagnostics[],
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
  };
}

function getActionDiagnostics(payload: unknown): WorkorderReadonlyActionDiagnostics[] {
  try {
    return normalizeWorkorderAgentPayload(payload).actions.map((action) => ({
      actionId: action.actionId,
      label: action.label,
      mode: action.mode,
      targetId: action.targetId,
      valid: action.valid,
      status: action.status,
      rejectionReason: action.rejectionReason,
    }));
  } catch {
    return [];
  }
}

function getPayloadIdentity(payload: unknown): Pick<WorkorderWidgetShadowDiagnostics, 'lastPayloadType' | 'intent'> {
  const root = getRecord(payload);
  const record = getRecord(root?.workspace_payload) ?? root;

  return {
    lastPayloadType: getText(record?.payload_type),
    intent: getText(record?.intent),
  };
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
