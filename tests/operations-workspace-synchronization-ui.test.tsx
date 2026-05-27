import { describe, expect, it, vi } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

import { MaintenanceAssistantPanel, buildInsightSynchronizationActions } from '../src/pages/maintenance/MaintenanceWorkorderTrackingPage';
import {
  applyUiAction,
  applyUiActions,
  createInitialOperationsWorkspaceState,
} from '../src/services/operationsWorkspaceRuntime';
import type { Insight } from '../src/types/operationsWorkspace';
import type { MaintenanceDashboardSummary, MaintenanceWorkOrder } from '../src/types/maintenance';

const workorders: MaintenanceWorkOrder[] = [
  {
    workorder_no: 'WO-100',
    equipment_no: 'MACHINE-7A',
    status: 'open',
    job_type: 'CM',
    priority: 'High',
    total_repair_time_hours: 2,
    down_time_hours: 1,
    task_count: 1,
    part_transaction_count: 0,
    issued_qty: 0,
  },
];

const summary: MaintenanceDashboardSummary = {
  open_workorder_count: 1,
  overdue_workorder_count: 0,
  on_hold_workorder_count: 0,
  completed_workorder_count: 0,
  total_downtime_hours: 1,
  repeat_failure_candidate_count: 1,
  stock_risk_item_count: 0,
  mtbf_mttr: [],
  top_risk_machines: [],
  top_hold_reasons: [],
};

const insight: Insight = {
  id: 'insight-repeat-7a',
  type: 'repeat_failure',
  severity: 'high',
  title: 'Repeat failure on MACHINE-7A',
  summary: 'WO-100 and MACHINE-7A should stay in focus.',
  related_entities: [
    { entity_type: 'workorder', entity_id: 'WO-100' },
    { entity_type: 'machine', entity_id: 'MACHINE-7A' },
  ],
  metadata: {
    chart_id: 'maintenance_frequency_chart',
  },
};

describe('operations workspace visualization synchronization', () => {
  it('propagates selected entity context from table or drawer selection', () => {
    const state = applyUiAction(createInitialOperationsWorkspaceState(), {
      type: 'open_detail_panel',
      target: 'workorder_drawer',
      entity_id: 'WO-100',
      metadata: {
        entity_type: 'workorder',
        workorder_id: 'WO-100',
        machine_id: 'MACHINE-7A',
      },
    });

    expect(state.selectedWorkorderId).toBe('WO-100');
    expect(state.selectedMachineId).toBe('MACHINE-7A');
    expect(state.synchronizedEntityContext?.source).toBe('drawer');
    expect(state.openPanel?.target).toBe('workorder_drawer');
  });

  it('synchronizes insight clicks into highlights, chart focus, active insight, and optional drawer context', () => {
    const synchronization = buildInsightSynchronizationActions(insight, workorders);
    const state = applyUiActions(createInitialOperationsWorkspaceState(), synchronization.actions);

    expect(synchronization.workorderToOpen?.workorder_no).toBe('WO-100');
    expect(state.activeInsightIds).toContain('insight-repeat-7a');
    expect(state.selectedInsightId).toBe('insight-repeat-7a');
    expect(state.focusedChartId).toBe('maintenance_frequency_chart');
    expect(state.selectedChartId).toBe('maintenance_frequency_chart');
    expect(state.highlightedEntities.workorder_table).toEqual(expect.arrayContaining(['WO-100', 'MACHINE-7A']));
    expect(state.selectedWorkorderId).toBe('WO-100');
  });

  it('renders clickable selected insight cards and compact synchronization diagnostics', () => {
    const state = applyUiActions(createInitialOperationsWorkspaceState(), buildInsightSynchronizationActions(insight, workorders).actions);
    const markup = renderToStaticMarkup(
      <MaintenanceAssistantPanel
        isOpen
        onClose={() => {}}
        messages={[{
          id: 1,
          role: 'assistant',
          content: 'Focus the repeat failure.',
          timestamp: '12:00',
          insights: [insight],
          uiActions: [],
        }]}
        inputMessage=""
        setInputMessage={() => {}}
        onSendMessage={() => {}}
        summary={summary}
        workspaceState={state}
        onInsightSelected={() => {}}
      />,
    );

    expect(markup).toContain('Repeat failure on MACHINE-7A');
    expect(markup).toContain('Workspace synchronization');
    expect(markup).toContain('Focused chart Maintenance Frequency Chart');
    expect(markup).toContain('Active insights 1');
  });

  it('synchronizes chart focus and propagates related highlights', () => {
    const state = applyUiAction(createInitialOperationsWorkspaceState(), {
      type: 'focus_chart',
      target: 'maintenance_frequency_chart',
      entity_ids: ['MACHINE-7A'],
    });

    expect(state.focusedChartId).toBe('maintenance_frequency_chart');
    expect(state.selectedChartId).toBe('maintenance_frequency_chart');
    expect(state.highlightedEntities.workorder_table).toContain('MACHINE-7A');
    expect(state.visualizationFocusTarget?.targetType).toBe('chart');
  });

  it('synchronizes time range globally without requiring a refresh', () => {
    const state = applyUiAction(createInitialOperationsWorkspaceState(), {
      type: 'set_time_range',
      target: 'maintenance_dashboard',
      range: { value: 'last_14_days', label: 'Last 14 days' },
    });

    expect(state.timeRange).toBe('last_14_days');
    expect(state.synchronizedTimeRange).toEqual({ value: 'last_14_days', label: 'Last 14 days', from: null, to: null });
    expect(state.appliedActionHistory.at(-1)?.status).toBe('applied');
  });

  it('safely rejects invalid synchronization references and records history', () => {
    const state = applyUiActions(createInitialOperationsWorkspaceState(), [
      { type: 'focus_chart', target: 'unknown_chart' },
      { type: 'highlight_entities', target: 'unknown_table', entity_ids: ['WO-999'] },
    ]);

    expect(state.focusedChartId).toBeNull();
    expect(state.highlightedEntities.workorder_table).toBeUndefined();
    expect(state.appliedActionHistory).toHaveLength(2);
    expect(state.appliedActionHistory.every((entry) => entry.status === 'rejected')).toBe(true);
  });

  it('keeps synchronization local-only with no backend mutation', () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch');
    const state = applyUiActions(createInitialOperationsWorkspaceState(), buildInsightSynchronizationActions(insight, workorders).actions);

    expect(state.appliedActionHistory.every((entry) => entry.status === 'applied')).toBe(true);
    expect(fetchSpy).not.toHaveBeenCalled();
    fetchSpy.mockRestore();
  });
});
