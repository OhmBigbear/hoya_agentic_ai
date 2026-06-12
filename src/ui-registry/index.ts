export type {
  ActionExecutionPolicyMetadata,
  ActionExecutionRequest,
  ActionExecutionResult,
  AgentReadonlyAction,
  AgentReadonlyActionDefinition,
  AgentReadonlyActionId,
  AgentReadonlyActionValidation,
} from './actions/readonlyActions';

export {
  agentReadonlyActionIds,
  agentReadonlyActionRegistry,
  agentReadonlyActionTargetIds,
  executeReadonlyActionNoop,
  getAgentReadonlyActionDefinition,
  guardReadonlyActionExecution,
  isWriteLikeActionId,
  readonlyActionExecutionPolicy,
  validateAgentReadonlyAction,
  validateAgentReadonlyActions,
} from './actions/readonlyActions';

export type {
  UiActionTargetId,
  UiDataTableWidget,
  UiEmptyStateWidget,
  UiErrorStateWidget,
  UiEvidenceListWidget,
  UiEvidenceRef,
  UiInsightListWidget,
  UiKpiCardWidget,
  UiNarrativePanelWidget,
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
  WorkorderAgentNarrative,
  WorkorderAgentPayloadAdapterOptions,
  WorkorderAgentRuntimeEnvelope,
  WorkorderRuntimeDiagnostic,
  WorkorderRuntimeRejectedWidget,
  WorkorderRuntimeTraceMetadata,
} from './adapters/workorderAgentPayloadAdapter';

export {
  buildWorkorderWidgetShadowDiagnostics,
} from './adapters/workorderShadowDiagnostics';
export type {
  WorkorderReadonlyActionDiagnostics,
  WorkorderWidgetShadowDiagnostics,
  WorkorderWidgetShadowDiagnosticsOptions,
} from './adapters/workorderShadowDiagnostics';

export {
  buildWorkorderWidgetPreviewModel,
} from './adapters/workorderWidgetPreviewModel';
export type {
  WorkorderWidgetPreviewModel,
} from './adapters/workorderWidgetPreviewModel';
