import type {
  UiActionTargetId,
  UiRegionId,
  UiSurfaceDefinition,
} from '../types';

export const maintenanceWorkordersSurfaceId = 'maintenance.workorders';

export const maintenanceWorkordersRegionIds = [
  'maintenance.workorders.kpi.summary',
  'maintenance.workorders.filters',
  'maintenance.workorders.table',
  'maintenance.workorders.drawer',
  'maintenance.workorders.charts',
  'maintenance.workorders.insights',
  'maintenance.workorders.copilot',
  'maintenance.workorders.evidence',
  'maintenance.workorders.actions.readonly',
] as const satisfies readonly UiRegionId[];

export const maintenanceWorkordersActionTargetIds = [
  'maintenance.workorders.actions.preview_workorder',
  'maintenance.workorders.actions.preview_machine',
  'maintenance.workorders.actions.preview_downtime',
  'maintenance.workorders.actions.preview_evidence',
  'maintenance.workorders.actions.open_copilot_context',
  'maintenance.workorders.actions.filter_by_machine',
  'maintenance.workorders.actions.filter_by_status',
  'maintenance.workorders.actions.filter_by_priority',
] as const satisfies readonly UiActionTargetId[];

export const maintenanceWorkordersSurface: UiSurfaceDefinition = {
  id: maintenanceWorkordersSurfaceId,
  label: 'Maintenance workorders',
  regions: [
    {
      id: 'maintenance.workorders.kpi.summary',
      label: 'KPI summary',
      allowedWidgetTypes: ['kpi_card', 'summary_card', 'empty_state', 'error_state'],
    },
    {
      id: 'maintenance.workorders.filters',
      label: 'Filters',
      allowedWidgetTypes: ['summary_card', 'empty_state', 'error_state'],
    },
    {
      id: 'maintenance.workorders.table',
      label: 'Workorder table',
      allowedWidgetTypes: ['data_table', 'empty_state', 'error_state'],
    },
    {
      id: 'maintenance.workorders.drawer',
      label: 'Workorder drawer',
      allowedWidgetTypes: ['summary_card', 'evidence_list', 'empty_state', 'error_state'],
    },
    {
      id: 'maintenance.workorders.charts',
      label: 'Charts',
      allowedWidgetTypes: ['trend_chart', 'summary_card', 'empty_state', 'error_state'],
    },
    {
      id: 'maintenance.workorders.insights',
      label: 'Insights',
      allowedWidgetTypes: ['insight_list', 'empty_state', 'error_state'],
    },
    {
      id: 'maintenance.workorders.copilot',
      label: 'Copilot',
      allowedWidgetTypes: ['insight_list', 'summary_card', 'empty_state', 'error_state'],
    },
    {
      id: 'maintenance.workorders.evidence',
      label: 'Evidence',
      allowedWidgetTypes: ['evidence_list', 'empty_state', 'error_state'],
    },
    {
      id: 'maintenance.workorders.actions.readonly',
      label: 'Read-only actions',
      allowedWidgetTypes: ['action_list_readonly', 'empty_state', 'error_state'],
    },
  ],
  actionTargets: [
    {
      id: 'maintenance.workorders.actions.preview_workorder',
      label: 'Preview workorder',
      metadata: { mode: 'read_only', scope: 'ui_local', intent: 'preview' },
    },
    {
      id: 'maintenance.workorders.actions.preview_machine',
      label: 'Preview machine',
      metadata: { mode: 'read_only', scope: 'ui_local', intent: 'preview' },
    },
    {
      id: 'maintenance.workorders.actions.preview_downtime',
      label: 'Preview downtime',
      metadata: { mode: 'read_only', scope: 'ui_local', intent: 'preview' },
    },
    {
      id: 'maintenance.workorders.actions.preview_evidence',
      label: 'Preview evidence',
      metadata: { mode: 'read_only', scope: 'ui_local', intent: 'preview' },
    },
    {
      id: 'maintenance.workorders.actions.open_copilot_context',
      label: 'Open copilot context',
      metadata: { mode: 'read_only', scope: 'ui_local', intent: 'preview' },
    },
    {
      id: 'maintenance.workorders.actions.filter_by_machine',
      label: 'Filter by machine',
      metadata: { mode: 'read_only', scope: 'ui_local', intent: 'filter' },
    },
    {
      id: 'maintenance.workorders.actions.filter_by_status',
      label: 'Filter by status',
      metadata: { mode: 'read_only', scope: 'ui_local', intent: 'filter' },
    },
    {
      id: 'maintenance.workorders.actions.filter_by_priority',
      label: 'Filter by priority',
      metadata: { mode: 'read_only', scope: 'ui_local', intent: 'filter' },
    },
  ],
  metadata: {
    pilotSurface: true,
    rendering: 'not_integrated',
  },
};
