export type UiSurfaceId = string;
export type UiRegionId = string;
export type UiWidgetId = string;
export type UiActionTargetId = string;

export type UiWidgetType =
  | 'kpi_card'
  | 'summary_card'
  | 'data_table'
  | 'trend_chart'
  | 'insight_list'
  | 'evidence_list'
  | 'action_list_readonly'
  | 'empty_state'
  | 'error_state';

export interface UiTraceRef {
  id: string;
  label?: string;
  source?: string;
  metadata?: Record<string, unknown>;
}

export interface UiEvidenceRef {
  id: string;
  label?: string;
  source?: string;
  href?: string;
  metadata?: Record<string, unknown>;
}

export interface UiWidgetBase {
  id: UiWidgetId;
  type: UiWidgetType;
  regionId: UiRegionId;
  title?: string;
  description?: string;
  traceRefs?: UiTraceRef[];
  evidenceRefs?: UiEvidenceRef[];
  metadata?: Record<string, unknown>;
}

export interface UiKpiCardWidget extends UiWidgetBase {
  type: 'kpi_card';
  value?: string | number | null;
  unit?: string;
  trend?: 'up' | 'down' | 'flat';
}

export interface UiSummaryCardWidget extends UiWidgetBase {
  type: 'summary_card';
  summary?: string;
  items?: Array<{
    label: string;
    value: string | number | null;
  }>;
}

export interface UiDataTableWidget extends UiWidgetBase {
  type: 'data_table';
  columns?: Array<{
    id: string;
    label: string;
    field?: string;
  }>;
  rows?: Array<Record<string, unknown>>;
}

export interface UiTrendChartWidget extends UiWidgetBase {
  type: 'trend_chart';
  series?: Array<{
    id: string;
    label?: string;
    points: Array<{
      x: string | number;
      y: number | null;
    }>;
  }>;
}

export interface UiInsightListWidget extends UiWidgetBase {
  type: 'insight_list';
  insights?: Array<{
    id: string;
    title: string;
    summary?: string;
    severity?: string;
    traceRefs?: UiTraceRef[];
    evidenceRefs?: UiEvidenceRef[];
    metadata?: Record<string, unknown>;
  }>;
}

export interface UiEvidenceListWidget extends UiWidgetBase {
  type: 'evidence_list';
  evidenceRefs: UiEvidenceRef[];
}

export interface UiReadonlyActionListWidget extends UiWidgetBase {
  type: 'action_list_readonly';
  actions?: Array<{
    id: string;
    label: string;
    targetId: UiActionTargetId;
    description?: string;
    metadata?: Record<string, unknown>;
  }>;
}

export interface UiEmptyStateWidget extends UiWidgetBase {
  type: 'empty_state';
  message?: string;
}

export interface UiErrorStateWidget extends UiWidgetBase {
  type: 'error_state';
  message?: string;
  errorCode?: string;
}

export type UiWidget =
  | UiKpiCardWidget
  | UiSummaryCardWidget
  | UiDataTableWidget
  | UiTrendChartWidget
  | UiInsightListWidget
  | UiEvidenceListWidget
  | UiReadonlyActionListWidget
  | UiEmptyStateWidget
  | UiErrorStateWidget;

export interface UiRegionDefinition {
  id: UiRegionId;
  label?: string;
  allowedWidgetTypes?: UiWidgetType[];
  metadata?: Record<string, unknown>;
}

export interface UiSurfaceDefinition {
  id: UiSurfaceId;
  label?: string;
  regions: UiRegionDefinition[];
  actionTargets?: Array<{
    id: UiActionTargetId;
    label?: string;
    metadata?: Record<string, unknown>;
  }>;
  metadata?: Record<string, unknown>;
}

export interface UiWidgetRegistryEntry {
  type: UiWidgetType;
  label?: string;
  description?: string;
  metadata?: Record<string, unknown>;
}

export interface UiValidationIssue {
  code: string;
  message: string;
  path?: string;
}

export interface UiValidationResult {
  valid: boolean;
  errors: UiValidationIssue[];
  warnings: UiValidationIssue[];
}
