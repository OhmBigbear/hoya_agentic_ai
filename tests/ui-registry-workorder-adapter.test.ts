import { describe, expect, it } from 'vitest';

import {
  adaptWorkorderAgentPayloadToWidgets,
  isWorkorderAgentPayloadLike,
  maintenanceWorkordersActionTargetIds,
  maintenanceWorkordersRegionIds,
  maintenanceWorkordersSurface,
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

  it('maps readonly action payload only to allowed action targets', () => {
    const widgets = adaptWorkorderAgentPayloadToWidgets({
      ...basePayload,
      filters: { equipment_no: 'MACHINE-7A' },
      actions: [
        { id: 'open-wo', label: 'Preview WO-100', action_type: 'open_detail', target: 'WO-100', enabled: true },
        { id: 'filter-machine', label: 'Filter machine', action_type: 'apply_filter', target: 'workorder_table', enabled: true },
        { id: 'trace', label: 'Open trace', action_type: 'open_trace', target: 'trace-1', enabled: true },
      ],
    });
    const actionWidget = widgets.find((widget): widget is Extract<UiWidget, { type: 'action_list_readonly' }> => widget.type === 'action_list_readonly');

    expect(actionWidget?.actions?.map((action) => action.targetId)).toEqual([
      'maintenance.workorders.actions.preview_workorder',
      'maintenance.workorders.actions.filter_by_machine',
      'maintenance.workorders.actions.open_copilot_context',
    ]);
    actionWidget?.actions?.forEach((action) => {
      expect(maintenanceWorkordersActionTargetIds).toContain(action.targetId);
    });
    assertAllWidgetsValid(widgets);
  });

  it('drops unsupported action targets', () => {
    const widgets = adaptWorkorderAgentPayloadToWidgets({
      ...basePayload,
      actions: [
        {
          id: 'bad-target',
          label: 'Unsupported',
          action_type: 'open_detail',
          target: 'maintenance.workorders.actions.approve_workorder',
          enabled: true,
        },
        {
          id: 'bad-type',
          label: 'Delete',
          action_type: 'delete_workorder',
          target: 'maintenance.workorders.actions.preview_workorder',
          enabled: true,
        },
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
      actions: [{ id: 'open', label: 'Preview', action_type: 'open_detail', target: 'WO-100', enabled: true }],
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
