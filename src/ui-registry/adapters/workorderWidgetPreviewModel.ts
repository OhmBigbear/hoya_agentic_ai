import { maintenanceWorkordersSurface } from '../surfaces/maintenanceWorkordersSurface';
import type { UiValidationResult, UiWidget } from '../types';
import { validateWidgetList } from '../validation';
import { adaptWorkorderAgentPayloadToWidgets } from './workorderAgentPayloadAdapter';
import type { WorkorderWidgetShadowDiagnostics } from './workorderShadowDiagnostics';

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

    return {
      widgets,
      diagnostics: {
        adaptedWidgetCount: widgets.length,
        validationValid: validation.valid,
        errorCount: validation.errors.length,
        warningCount: validation.warnings.length,
        ...identity,
      },
      validation,
      safeToRender: widgets.length > 0,
    };
  } catch {
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
        ...identity,
      },
      validation,
      safeToRender: false,
    };
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
