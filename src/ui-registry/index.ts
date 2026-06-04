export type {
  UiActionTargetId,
  UiDataTableWidget,
  UiEmptyStateWidget,
  UiErrorStateWidget,
  UiEvidenceListWidget,
  UiEvidenceRef,
  UiInsightListWidget,
  UiKpiCardWidget,
  UiReadonlyActionListWidget,
  UiRegionDefinition,
  UiRegionId,
  UiSummaryCardWidget,
  UiSurfaceDefinition,
  UiSurfaceId,
  UiTraceRef,
  UiTrendChartWidget,
  UiValidationIssue,
  UiValidationResult,
  UiWidget,
  UiWidgetBase,
  UiWidgetId,
  UiWidgetRegistryEntry,
  UiWidgetType,
} from './types';

export {
  createSurfaceRegistry,
  createWidgetRegistry,
  getSurfaceDefinition,
  getWidgetRegistryEntry,
  isActionTargetAllowed,
  isRegionAllowed,
  listSurfaceRegions,
} from './registry';
export type { UiSurfaceRegistry, UiWidgetRegistry } from './registry';

export {
  isSupportedWidgetType,
  validateSurfaceDefinition,
  validateWidget,
  validateWidgetList,
} from './validation';

export {
  EmptyWidgetFallback,
  InvalidWidgetFallback,
  UnsupportedWidgetFallback,
  WidgetValidationMessages,
} from './WidgetFallback';
export type { UiWidgetFallbackMode } from './WidgetFallback';

export {
  renderUiWidget,
  renderUiWidgetList,
} from './renderWidget';
export type {
  RenderUiWidgetOptions,
  UiReadonlyActionEvent,
} from './renderWidget';

export {
  maintenanceWorkordersActionTargetIds,
  maintenanceWorkordersRegionIds,
  maintenanceWorkordersSurface,
  maintenanceWorkordersSurfaceId,
} from './surfaces/maintenanceWorkordersSurface';

export {
  adaptWorkorderAgentPayloadToWidgets,
  isWorkorderAgentPayloadLike,
  normalizeWorkorderAgentPayload,
} from './adapters/workorderAgentPayloadAdapter';
export type {
  NormalizedWorkorderAgentPayload,
  WorkorderAgentPayloadAdapterOptions,
} from './adapters/workorderAgentPayloadAdapter';

export {
  buildWorkorderWidgetShadowDiagnostics,
} from './adapters/workorderShadowDiagnostics';
export type {
  WorkorderWidgetShadowDiagnostics,
  WorkorderWidgetShadowDiagnosticsOptions,
} from './adapters/workorderShadowDiagnostics';

export {
  buildWorkorderWidgetPreviewModel,
} from './adapters/workorderWidgetPreviewModel';
export type {
  WorkorderWidgetPreviewModel,
} from './adapters/workorderWidgetPreviewModel';
