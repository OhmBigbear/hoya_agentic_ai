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
  maintenanceWorkordersActionTargetIds,
  maintenanceWorkordersRegionIds,
  maintenanceWorkordersSurface,
  maintenanceWorkordersSurfaceId,
} from './surfaces/maintenanceWorkordersSurface';
