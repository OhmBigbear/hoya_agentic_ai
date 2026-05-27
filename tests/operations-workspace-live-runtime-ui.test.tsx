import { describe, expect, it, vi } from 'vitest';

import { normalizeOperationsWorkspacePreviewResponse, requestOperationsWorkspacePreview } from '../src/services/operationsWorkspaceCopilotApi';
import {
  buildOperationsWorkspacePreviewFilters,
} from '../src/pages/maintenance/MaintenanceWorkorderTrackingPage';
import {
  applyUiActions,
  createInitialOperationsWorkspaceState,
} from '../src/services/operationsWorkspaceRuntime';

describe('operations workspace live runtime preview', () => {
  it('normalizes mocked Copilot preview responses', () => {
    const normalized = normalizeOperationsWorkspacePreviewResponse({
      assistant_text: ' Focus maintenance risks. ',
      insights: [{
        id: ' insight-1 ',
        type: ' repeat_failure ',
        severity: 'high',
        title: ' Repeated failure detected ',
        summary: ' MACHINE-7A has repeated workorders. ',
      }],
      ui_actions: [
        { type: 'set_filter', target: 'workorder_table', filters: { equipment_no: 'MACHINE-7A' } },
        { type: 'open_detail_panel', target: 'workorder_drawer' },
      ],
      source_tool_ids: ['tool-workorders'],
    });

    expect(normalized.assistant_text).toBe('Focus maintenance risks.');
    expect(normalized.insights[0].title).toBe('Repeated failure detected');
    expect(normalized.ui_actions[0].valid).toBe(true);
    expect(normalized.ui_actions[1].valid).toBe(false);
  });

  it('sends preview requests to the read-only Copilot preview endpoint', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({
        assistant_text: 'Preview ready.',
        insights: [],
        ui_actions: [],
      }), { status: 200, headers: { 'content-type': 'application/json' } }),
    );

    await requestOperationsWorkspacePreview({
      message: 'show repeat failures',
      filters: { workorder_table: { machine: 'MACHINE-7A' } },
      limit: 3,
    });

    expect(fetchSpy).toHaveBeenCalledTimes(1);
    expect(JSON.parse(String(fetchSpy.mock.calls[0][1]?.body))).toEqual({
      message: 'show repeat failures',
      filters: { workorder_table: { machine: 'MACHINE-7A' } },
      limit: 3,
    });
    fetchSpy.mockRestore();
  });

  it('includes synchronized context in future preview filters', () => {
    const state = applyUiActions(createInitialOperationsWorkspaceState(), [
      {
        type: 'open_detail_panel',
        target: 'workorder_drawer',
        entity_id: 'WO-100',
        metadata: {
          entity_type: 'workorder',
          workorder_id: 'WO-100',
          machine_id: 'MACHINE-7A',
        },
      },
      { type: 'focus_chart', target: 'maintenance_frequency_chart', entity_ids: ['MACHINE-7A'] },
      { type: 'set_time_range', target: 'maintenance_dashboard', range: { value: 'last_7_days' } },
    ]);

    const filters = buildOperationsWorkspacePreviewFilters(
      {
        search: 'bearing',
        status: 'open',
        machine: 'MACHINE-7A',
        workType: 'CM',
        priority: 'High',
        overdueOnly: true,
        waitingPartsOnly: false,
      },
      state,
    );

    expect(filters.selected_workorder).toBe('WO-100');
    expect(filters.selected_machine).toBe('MACHINE-7A');
    expect(filters.focused_chart).toBe('maintenance_frequency_chart');
    expect(filters.time_range).toBe('last_7_days');
  });
});
