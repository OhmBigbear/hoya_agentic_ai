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
  workspace_payload?: WorkspacePayload;
  trace?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}

export interface OperationsWorkspacePreviewRequest {
  message: string;
  filters?: Record<string, unknown>;
  limit?: number;
}

export interface OperationsWorkspacePreviewResponse extends Omit<CopilotStructuredResponse, 'ui_actions'> {
  ui_actions: UiActionPreview[];
}

export type WorkspacePayloadConfidence = 'low' | 'medium' | 'high';
export type WorkspacePayloadSeverity = 'normal' | 'warning' | 'critical' | 'unknown';
export type WorkspacePayloadTrend = 'up' | 'down' | 'flat' | 'unknown';
export type WorkspacePayloadChartType = 'bar' | 'line' | 'donut' | 'table';
export type WorkspacePayloadPriority = 'low' | 'medium' | 'high';
export type WorkspacePayloadEvidenceSource = 'tool' | 'api' | 'dataset' | 'agent' | 'system';
export type WorkspacePayloadActionType = 'open_trace' | 'open_detail' | 'apply_filter';

export interface WorkspacePayloadTimeRange {
  from?: string;
  to?: string;
  timezone?: string;
  label?: string;
}

export interface WorkspacePayloadSummary {
  title: string;
  headline: string;
  confidence: WorkspacePayloadConfidence;
  severity: WorkspacePayloadSeverity;
  time_range?: WorkspacePayloadTimeRange | null;
  limitations: string[];
}

export interface WorkspacePayloadKpiCard {
  id: string;
  label: string;
  value: string | number;
  unit?: string;
  trend: WorkspacePayloadTrend;
  severity: WorkspacePayloadSeverity;
  description?: string;
}

export interface WorkspacePayloadChart {
  id: string;
  type: WorkspacePayloadChartType;
  title: string;
  description?: string;
  x_key?: string;
  y_key?: string;
  data: Record<string, unknown>[];
}

export interface WorkspacePayloadRecommendation {
  id: string;
  priority: WorkspacePayloadPriority;
  title: string;
  rationale: string;
  suggested_action: string;
  requires_human_decision: true;
  related_refs: string[];
}

export interface WorkspacePayloadEvidence {
  source_type: WorkspacePayloadEvidenceSource;
  source_name: string;
  reference?: string;
  timestamp?: string;
  description?: string;
}

export interface WorkspacePayloadAction {
  id: string;
  label: string;
  action_type: WorkspacePayloadActionType;
  target?: string;
  enabled: boolean;
}

export interface WorkspacePayload {
  payload_version: '1.0';
  payload_type: 'workorder_insight';
  intent: 'workorder_insight';
  generated_at?: string;
  summary: WorkspacePayloadSummary;
  kpi_cards: WorkspacePayloadKpiCard[];
  charts: WorkspacePayloadChart[];
  recommendations: WorkspacePayloadRecommendation[];
  evidence: WorkspacePayloadEvidence[];
  actions: WorkspacePayloadAction[];
  filters?: Record<string, unknown>;
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
