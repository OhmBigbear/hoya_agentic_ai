import { describe, expect, it } from 'vitest';

import {
  adaptWorkorderAgentPayloadToWidgets,
  agentReadonlyActionIds,
  agentReadonlyActionRegistry,
  isWorkorderAgentPayloadLike,
  maintenanceWorkordersActionTargetIds,
  maintenanceWorkordersRegionIds,
  maintenanceWorkordersSurface,
  validateAgentReadonlyAction,
  validateWidget,
} from '../src/ui-registry';
import type { UiWidget } from '../src/ui-registry';

const basePayload = {
  payload_version: '1.0',
  payload_type: 'workorder_insight',
  intent: 'workorder_insight',
  generated_at: '2026-06-04T10:00:00+07:00',
  summary: {
    title: 'Maintenance risk summary',
    headline: 'Open workorders are concentrated on MACHINE-7A.',
    confidence: 'high',
    severity: 'warning',
    limitations: ['Preview only'],
  },
  kpi_cards: [],
  charts: [],
  recommendations: [],
  evidence: [],
  actions: [],
  trace_id: 'trace-1',
};

const allowedWidgetTypes = new Set([
  'kpi_card',
  'summary_card',
  'data_table',
  'trend_chart',
  'insight_list',
  'evidence_list',
  'action_list_readonly',
  'empty_state',
  'error_state',
]);

describe('workorder agent payload adapter', () => {
  it('detects valid object-like payload', () => {
    expect(isWorkorderAgentPayloadLike(basePayload)).toBe(true);
    expect(isWorkorderAgentPayloadLike({ workspace_payload: basePayload })).toBe(true);
    expect(isWorkorderAgentPayloadLike({ unrelated: true })).toBe(false);
  });

  it('maps null, undefined, and non-object payloads to empty_state', () => {
    [null, undefined, 'bad input'].forEach((payload) => {
      const widgets = adaptWorkorderAgentPayloadToWidgets(payload);

      expect(widgets).toHaveLength(1);
      expect(widgets[0].type).toBe('empty_state');
      assertAllWidgetsValid(widgets);
    });
  });

  it('maps error payload to error_state', () => {
    const widgets = adaptWorkorderAgentPayloadToWidgets({
      payload_type: 'workorder_insight',
      error: { message: 'Preview failed', code: 'PREVIEW_FAILED' },
    });

    expect(widgets).toHaveLength(1);
    expect(widgets[0]).toMatchObject({
      type: 'error_state',
      message: 'Preview failed',
      errorCode: 'PREVIEW_FAILED',
    });
    assertAllWidgetsValid(widgets);
  });

  it('maps summary payload to summary_card and kpi payload to kpi_card', () => {
    const widgets = adaptWorkorderAgentPayloadToWidgets({
      ...basePayload,
      kpi_cards: [{
        id: 'open-workorders',
        label: 'Open workorders',
        value: 12,
        unit: 'orders',
        trend: 'up',
        severity: 'warning',
      }],
    });

    expect(widgets.some((widget) => widget.type === 'summary_card')).toBe(true);
    expect(widgets.some((widget) => widget.type === 'kpi_card' && widget.title === 'Open workorders')).toBe(true);
    assertAllWidgetsValid(widgets);
  });

  it('maps insight payload to insight_list', () => {
    const widgets = adaptWorkorderAgentPayloadToWidgets({
      ...basePayload,
      recommendations: [{
        id: 'repeat-failure',
        priority: 'high',
        title: 'Repeat failure risk',
        rationale: 'MACHINE-7A has repeated open corrective workorders.',
        suggested_action: 'Review recent bearing repairs.',
        requires_human_decision: true,
        related_refs: ['wo-source'],
      }],
      evidence: [{
        source_type: 'tool',
        source_name: 'Workorder query',
        reference: 'wo-source',
        description: 'Open corrective workorders for MACHINE-7A',
      }],
    });
    const insightWidget = widgets.find((widget): widget is Extract<UiWidget, { type: 'insight_list' }> => widget.type === 'insight_list');

    expect(insightWidget?.insights?.[0]).toMatchObject({
      id: 'repeat-failure',
      title: 'Repeat failure risk',
      severity: 'high',
    });
    assertAllWidgetsValid(widgets);
  });

  it('maps evidence/source payload to evidence_list', () => {
    const widgets = adaptWorkorderAgentPayloadToWidgets({
      ...basePayload,
      sources: [{
        id: 'source-1',
        source: 'maintenance_db',
        summary: 'Workorder rows',
        href: '/readonly/workorders',
      }],
    });
    const evidenceWidget = widgets.find((widget): widget is Extract<UiWidget, { type: 'evidence_list' }> => widget.type === 'evidence_list');

    expect(evidenceWidget?.evidenceRefs[0]).toMatchObject({
      id: 'source-1',
      source: 'maintenance_db',
      href: '/readonly/workorders',
    });
    assertAllWidgetsValid(widgets);
  });

  it('maps valid readonly actions only to registered action targets', () => {
    const widgets = adaptWorkorderAgentPayloadToWidgets({
      ...basePayload,
      actions: [
        { id: 'view_workorder', mode: 'readonly', label: 'View WO-100', target: 'WO-100' },
        { id: 'view_machine', mode: 'readonly', label: 'View MACHINE-7A', target: 'MACHINE-7A' },
        { id: 'view_workorder_history', mode: 'readonly', label: 'History', target: 'WO-100' },
      ],
    });
    const actionWidget = widgets.find((widget): widget is Extract<UiWidget, { type: 'action_list_readonly' }> => widget.type === 'action_list_readonly');

    expect(actionWidget?.actions?.map((action) => action.targetId)).toEqual([
      'maintenance.workorders.actions.view_workorder',
      'maintenance.workorders.actions.view_machine',
      'maintenance.workorders.actions.view_workorder_history',
    ]);
    actionWidget?.actions?.forEach((action) => {
      expect(maintenanceWorkordersActionTargetIds).toContain(action.targetId);
    });
    assertAllWidgetsValid(widgets);
  });

  it('maps all six readonly action registry entries', () => {
    expect(agentReadonlyActionIds).toEqual([
      'view_workorder',
      'view_machine',
      'view_workorder_history',
      'view_delay_analysis',
      'view_bottleneck',
      'view_related_workorders',
    ]);
    expect(maintenanceWorkordersActionTargetIds).toEqual(agentReadonlyActionIds.map((id) => agentReadonlyActionRegistry[id].targetId));
  });

  it('rejects unknown readonly action IDs', () => {
    const result = validateAgentReadonlyAction({ id: 'view_unknown', mode: 'readonly', label: 'Unknown' });

    expect(result).toMatchObject({
      valid: false,
      rejectionCode: 'unknown_action_id',
    });
  });

  it('rejects non-readonly action modes', () => {
    const result = validateAgentReadonlyAction({ id: 'view_workorder', mode: 'execute', label: 'Run' });

    expect(result).toMatchObject({
      valid: false,
      rejectionCode: 'non_readonly_mode',
    });
  });

  it('rejects write-like action IDs before rendering', () => {
    const result = validateAgentReadonlyAction({ id: 'delete_workorder', mode: 'readonly', label: 'Delete' });

    expect(result).toMatchObject({
      valid: false,
      rejectionCode: 'write_like_action_id',
    });
  });

  it('drops rejected readonly action mappings from widgets', () => {
    const widgets = adaptWorkorderAgentPayloadToWidgets({
      ...basePayload,
      actions: [
        { id: 'view_unknown', mode: 'readonly', label: 'Unknown', target: 'WO-100' },
        { id: 'view_workorder', mode: 'execute', label: 'Execute', target: 'WO-100' },
        { id: 'delete_workorder', mode: 'readonly', label: 'Delete', target: 'WO-100' },
      ],
    });
    const actionWidget = widgets.find((widget): widget is Extract<UiWidget, { type: 'action_list_readonly' }> => widget.type === 'action_list_readonly');

    expect(actionWidget).toBeUndefined();
    assertAllWidgetsValid(widgets);
  });

  it('maps workorder rows to data_table when present', () => {
    const widgets = adaptWorkorderAgentPayloadToWidgets({
      ...basePayload,
      workorders: [
        { workorder_no: 'WO-100', equipment_no: 'MACHINE-7A', status: 'open', priority: 'High', private_notes: '<b>ignore</b>' },
      ],
    });
    const tableWidget = widgets.find((widget): widget is Extract<UiWidget, { type: 'data_table' }> => widget.type === 'data_table');

    expect(tableWidget?.rows?.[0]).toEqual({
      workorder_no: 'WO-100',
      equipment_no: 'MACHINE-7A',
      status: 'open',
      priority: 'High',
    });
    expect(tableWidget?.columns?.map((column) => column.field)).toEqual(['workorder_no', 'equipment_no', 'status', 'priority']);
    assertAllWidgetsValid(widgets);
  });

  it('maps chart/series payload to trend_chart when present', () => {
    const widgets = adaptWorkorderAgentPayloadToWidgets({
      ...basePayload,
      charts: [{
        id: 'downtime-trend',
        type: 'line',
        title: 'Downtime trend',
        x_key: 'date',
        y_key: 'hours',
        data: [
          { date: '2026-06-01', hours: 1.5 },
          { date: '2026-06-02', hours: '2' },
        ],
      }],
    });
    const chartWidget = widgets.find((widget): widget is Extract<UiWidget, { type: 'trend_chart' }> => widget.type === 'trend_chart');

    expect(chartWidget?.series?.[0].points).toEqual([
      { x: '2026-06-01', y: 1.5 },
      { x: '2026-06-02', y: 2 },
    ]);
    assertAllWidgetsValid(widgets);
  });

  it('emits only maintenance.workorders regions and allowlisted widget types', () => {
    const widgets = adaptWorkorderAgentPayloadToWidgets({
      ...basePayload,
      kpi_cards: [{ id: 'open', label: 'Open', value: 4, trend: 'flat', severity: 'normal' }],
      workorders: [{ workorder_no: 'WO-100', status: 'open' }],
      charts: [{ id: 'count', title: 'Count', type: 'line', data: [{ x: 'Mon', y: 4 }] }],
      actions: [{ id: 'view_workorder', mode: 'readonly', label: 'View', target: 'WO-100' }],
      sources: [{ id: 'source-1', source: 'maintenance_db', summary: 'Rows' }],
    });

    widgets.forEach((widget) => {
      expect(maintenanceWorkordersRegionIds).toContain(widget.regionId);
      expect(allowedWidgetTypes.has(widget.type)).toBe(true);
    });
    assertAllWidgetsValid(widgets);
  });
});

function assertAllWidgetsValid(widgets: UiWidget[]): void {
  widgets.forEach((widget) => {
    const result = validateWidget(widget, maintenanceWorkordersSurface);
    expect(result.errors).toEqual([]);
  });
}
