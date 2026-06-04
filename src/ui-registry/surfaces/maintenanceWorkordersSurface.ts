import type {
  UiActionTargetId,
  UiRegionId,
  UiSurfaceDefinition,
} from '../types';
import { agentReadonlyActionTargetIds } from '../actions/readonlyActions';

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

export const maintenanceWorkordersActionTargetIds = agentReadonlyActionTargetIds satisfies readonly UiActionTargetId[];

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
      id: 'maintenance.workorders.actions.view_workorder',
      label: 'View workorder',
      metadata: { mode: 'readonly', scope: 'ui_navigation', intent: 'inspect' },
    },
    {
      id: 'maintenance.workorders.actions.view_machine',
      label: 'View machine',
      metadata: { mode: 'readonly', scope: 'ui_navigation', intent: 'inspect' },
    },
    {
      id: 'maintenance.workorders.actions.view_workorder_history',
      label: 'View workorder history',
      metadata: { mode: 'readonly', scope: 'ui_navigation', intent: 'inspect' },
    },
    {
      id: 'maintenance.workorders.actions.view_delay_analysis',
      label: 'View delay analysis',
      metadata: { mode: 'readonly', scope: 'ui_navigation', intent: 'inspect' },
    },
    {
      id: 'maintenance.workorders.actions.view_bottleneck',
      label: 'View bottleneck',
      metadata: { mode: 'readonly', scope: 'ui_navigation', intent: 'inspect' },
    },
    {
      id: 'maintenance.workorders.actions.view_related_workorders',
      label: 'View related workorders',
      metadata: { mode: 'readonly', scope: 'ui_navigation', intent: 'inspect' },
    },
  ],
  metadata: {
    pilotSurface: true,
    rendering: 'not_integrated',
  },
};
