import { maintenanceWorkordersSurface } from '../surfaces/maintenanceWorkordersSurface';
import type { UiValidationResult } from '../types';
import { validateWidgetList } from '../validation';
import { adaptWorkorderAgentPayloadToWidgets } from './workorderAgentPayloadAdapter';

export interface WorkorderWidgetShadowDiagnostics {
  adaptedWidgetCount: number;
  validationValid: boolean;
  errorCount: number;
  warningCount: number;
  lastPayloadType?: string;
  intent?: string;
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

    return diagnosticsFromValidation(widgets.length, validation, identity);
  } catch (error) {
    options.onError?.(error);
    return {
      adaptedWidgetCount: 0,
      validationValid: false,
      errorCount: 1,
      warningCount: 0,
      ...identity,
    };
  }
}

function diagnosticsFromValidation(
  adaptedWidgetCount: number,
  validation: UiValidationResult,
  identity: Pick<WorkorderWidgetShadowDiagnostics, 'lastPayloadType' | 'intent'>,
): WorkorderWidgetShadowDiagnostics {
  return {
    adaptedWidgetCount,
    validationValid: validation.valid,
    errorCount: validation.errors.length,
    warningCount: validation.warnings.length,
    ...identity,
  };
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
