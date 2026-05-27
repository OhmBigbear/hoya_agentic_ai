export type UiActionType =
  | 'set_filter'
  | 'open_detail_panel'
  | 'focus_chart'
  | 'set_time_range'
  | 'highlight_entities'
  | 'clear_filter'
  | 'sort_table';

export type InsightSeverity = 'info' | 'low' | 'medium' | 'high' | 'critical';

export interface TraceAuditMetadata {
  trace_id?: string;
  action_id?: string;
  generated_by_agent_id?: string;
  source_tool_ids?: string[];
  confidence?: number;
  created_at?: string;
}

export interface UiAction extends TraceAuditMetadata {
  type: UiActionType | string;
  target?: string;
  filters?: Record<string, unknown>;
  entity_id?: string;
  entity_ids?: string[];
  range?: Record<string, unknown>;
  sort?: {
    field?: string;
    direction?: 'asc' | 'desc' | string;
  };
  metadata?: Record<string, unknown>;
}

export interface UiActionPreview extends UiAction {
  valid: boolean;
  validation_errors: string[];
}

export interface RelatedEntity {
  entity_type: string;
  entity_id: string;
  label?: string;
}

export interface InsightEvidence {
  source: string;
  summary: string;
  source_tool_id?: string;
  data?: Record<string, unknown>;
}

export interface Insight extends TraceAuditMetadata {
  id: string;
  type: string;
  severity: InsightSeverity;
  title: string;
  summary: string;
  evidence?: InsightEvidence[];
  related_entities?: RelatedEntity[];
  metadata?: Record<string, unknown>;
}

export interface CopilotStructuredResponse extends TraceAuditMetadata {
  assistant_text: string;
  insights: Insight[];
  ui_actions: UiAction[];
}

export interface OperationsWorkspacePreviewRequest {
  message: string;
  filters?: Record<string, unknown>;
  limit?: number;
}

export interface OperationsWorkspacePreviewResponse extends Omit<CopilotStructuredResponse, 'ui_actions'> {
  ui_actions: UiActionPreview[];
}

export interface DashboardStatePatch extends TraceAuditMetadata {
  ui_actions: UiAction[];
  reason?: string;
}

export interface FocusedEntity {
  entityType: string;
  entityId: string;
}

export interface SynchronizedEntityContext {
  machineId: string | null;
  workorderId: string | null;
  insightId: string | null;
  entityType: string | null;
  entityId: string | null;
  relatedEntityIds: string[];
  source: 'table' | 'chart' | 'drawer' | 'insight' | 'action' | 'time_range' | null;
}

export interface SynchronizedTimeRange {
  value: string;
  label?: string;
  from?: string;
  to?: string;
}

export interface VisualizationFocusTarget {
  targetType: 'table' | 'chart' | 'drawer' | 'insight' | 'dashboard';
  targetId: string;
  relatedEntityIds: string[];
}

export interface OpenPanelState {
  target: string;
  entityId?: string;
}

export interface TableSortState {
  field: string;
  direction: 'asc' | 'desc';
}

export type AppliedUiActionStatus = 'applied' | 'rejected';

export interface AppliedUiAction {
  action_id?: string;
  type: string;
  target?: string;
  status: AppliedUiActionStatus;
  reason?: string;
  applied_at: string;
}

export interface OperationsWorkspaceState {
  filters: Record<string, Record<string, unknown>>;
  focusedChartId: string | null;
  focusedEntity: FocusedEntity | null;
  highlightedEntities: Record<string, string[]>;
  openPanel: OpenPanelState | null;
  timeRange: string | null;
  selectedMachineId: string | null;
  selectedWorkorderId: string | null;
  selectedInsightId: string | null;
  selectedChartId: string | null;
  synchronizedEntityContext: SynchronizedEntityContext | null;
  synchronizedTimeRange: SynchronizedTimeRange | null;
  visualizationFocusTarget: VisualizationFocusTarget | null;
  activeInsightIds: string[];
  tableSorts: Record<string, TableSortState>;
  appliedActionHistory: AppliedUiAction[];
}

export interface UiActionValidationResult {
  valid: boolean;
  accepted_actions: UiAction[];
  errors: string[];
}
