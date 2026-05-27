import { describe, expect, it } from 'vitest';

import { validateUiActions } from '../src/services/operationsWorkspaceContracts';
import {
  applyUiActions,
  createInitialOperationsWorkspaceState,
} from '../src/services/operationsWorkspaceRuntime';

describe('operations workspace runtime UI actions', () => {
  it('validates read-only UI actions and rejects writeback-like actions', () => {
    const result = validateUiActions([
      { type: 'set_filter', target: 'workorder_table', filters: { status: 'open' } },
      { type: 'delete_workorder', target: 'maintenance_api', entity_id: 'WO-1' },
      { type: 'open_detail_panel', target: 'workorder_drawer' },
    ]);

    expect(result.valid).toBe(false);
    expect(result.accepted_actions).toHaveLength(1);
    expect(result.errors.join(' ')).toContain('writeback action type');
    expect(result.errors.join(' ')).toContain('open_detail_panel requires entity_id');
  });

  it('applies local dashboard state actions without writeback', () => {
    const state = applyUiActions(createInitialOperationsWorkspaceState(), [
      { type: 'set_filter', target: 'workorder_table', filters: { status: 'open' } },
      { type: 'focus_chart', target: 'maintenance_frequency_chart' },
      { type: 'set_time_range', target: 'maintenance_dashboard', range: { value: 'last_7_days' } },
      { type: 'highlight_entities', target: 'workorder_table', entity_ids: ['WO-1'] },
      { type: 'sort_table', target: 'workorder_table', sort: { field: 'priority', direction: 'desc' } },
      { type: 'update_workorder', target: 'maintenance_api', entity_id: 'WO-1' },
    ]);

    expect(state.filters.workorder_table).toEqual({ status: 'open' });
    expect(state.focusedChartId).toBe('maintenance_frequency_chart');
    expect(state.timeRange).toBe('last_7_days');
    expect(state.highlightedEntities.workorder_table).toContain('WO-1');
    expect(state.tableSorts.workorder_table).toEqual({ field: 'priority', direction: 'desc' });
    expect(state.appliedActionHistory.at(-1)?.status).toBe('rejected');
  });
});
