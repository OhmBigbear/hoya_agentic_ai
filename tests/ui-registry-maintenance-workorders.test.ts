import { describe, expect, it } from 'vitest';

import {
  isActionTargetAllowed,
  isRegionAllowed,
  maintenanceWorkordersActionTargetIds,
  maintenanceWorkordersRegionIds,
  maintenanceWorkordersSurface,
  maintenanceWorkordersSurfaceId,
  validateSurfaceDefinition,
} from '../src/ui-registry';

const expectedRegionIds = [
  'maintenance.workorders.kpi.summary',
  'maintenance.workorders.filters',
  'maintenance.workorders.table',
  'maintenance.workorders.drawer',
  'maintenance.workorders.charts',
  'maintenance.workorders.insights',
  'maintenance.workorders.copilot',
  'maintenance.workorders.evidence',
  'maintenance.workorders.actions.readonly',
];

const expectedActionTargetIds = [
  'maintenance.workorders.actions.preview_workorder',
  'maintenance.workorders.actions.preview_machine',
  'maintenance.workorders.actions.preview_downtime',
  'maintenance.workorders.actions.preview_evidence',
  'maintenance.workorders.actions.open_copilot_context',
  'maintenance.workorders.actions.filter_by_machine',
  'maintenance.workorders.actions.filter_by_status',
  'maintenance.workorders.actions.filter_by_priority',
];

const dangerousActionVerbs = [
  'commit',
  'approve',
  'delete',
  'mutate',
  'update',
  'create',
  'send',
];

describe('maintenance workorders surface definition', () => {
  it('validates successfully', () => {
    const result = validateSurfaceDefinition(maintenanceWorkordersSurface);

    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('uses the maintenance workorders surface id', () => {
    expect(maintenanceWorkordersSurfaceId).toBe('maintenance.workorders');
    expect(maintenanceWorkordersSurface.id).toBe('maintenance.workorders');
  });

  it('allows all expected regions', () => {
    expect(maintenanceWorkordersRegionIds).toEqual(expectedRegionIds);

    expectedRegionIds.forEach((regionId) => {
      expect(isRegionAllowed(maintenanceWorkordersSurface, regionId)).toBe(true);
    });
  });

  it('does not allow unknown regions', () => {
    expect(isRegionAllowed(maintenanceWorkordersSurface, 'maintenance.workorders.unknown')).toBe(false);
  });

  it('allows all expected read-only action targets', () => {
    expect(maintenanceWorkordersActionTargetIds).toEqual(expectedActionTargetIds);

    expectedActionTargetIds.forEach((actionTargetId) => {
      expect(isActionTargetAllowed(maintenanceWorkordersSurface, actionTargetId)).toBe(true);
    });
  });

  it('does not allow unknown action targets', () => {
    expect(isActionTargetAllowed(
      maintenanceWorkordersSurface,
      'maintenance.workorders.actions.approve_workorder',
    )).toBe(false);
  });

  it('has duplicate-free region and action definitions', () => {
    const regionIds = maintenanceWorkordersSurface.regions.map((region) => region.id);
    const actionTargetIds = maintenanceWorkordersSurface.actionTargets?.map((target) => target.id) ?? [];

    expect(new Set(regionIds).size).toBe(regionIds.length);
    expect(new Set(actionTargetIds).size).toBe(actionTargetIds.length);
  });

  it('does not include dangerous action verbs', () => {
    const actionTargetText = (maintenanceWorkordersSurface.actionTargets ?? [])
      .map((target) => `${target.id} ${target.label ?? ''}`)
      .join(' ')
      .toLowerCase();

    dangerousActionVerbs.forEach((verb) => {
      expect(actionTargetText).not.toContain(verb);
    });
  });

  it('marks every action target as read-only, UI-local, and preview or filter only', () => {
    (maintenanceWorkordersSurface.actionTargets ?? []).forEach((target) => {
      expect(target.metadata).toMatchObject({ mode: 'read_only', scope: 'ui_local' });
      expect(['preview', 'filter']).toContain(target.metadata?.intent);
    });
  });
});
